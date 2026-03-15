import "dotenv/config";
import * as admin from "firebase-admin";
import { onCall, onRequest, HttpsError } from "firebase-functions/v2/https";
import { google } from "googleapis";
import { Readable } from "node:stream";

admin.initializeApp();

function requireEnv(name: string) {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

type CallableContext = {
  auth?: {
    uid: string;
    token?: Record<string, unknown>;
  };
};

function requireAuth(context: CallableContext) {
  if (!context.auth?.uid) {
    throw new HttpsError("unauthenticated", "Authentication is required.");
  }
  return context.auth.uid;
}

function buildOAuthClient() {
  return new google.auth.OAuth2(
    requireEnv("YOUTUBE_CLIENT_ID"),
    requireEnv("YOUTUBE_CLIENT_SECRET"),
    requireEnv("YOUTUBE_REDIRECT_URI"),
  );
}

async function getMembershipRole(spaceId: string, uid: string) {
  const snapshot = await admin
    .firestore()
    .doc(`spaces/${spaceId}/memberships/${uid}`)
    .get();
  const data = snapshot.data();
  return data?.role as string | undefined;
}

async function requireSpaceAdmin(spaceId: string, uid: string) {
  const role = await getMembershipRole(spaceId, uid);
  if (role !== "space_admin") {
    throw new HttpsError("permission-denied", "Space admin access required.");
  }
}

function settingsRef(spaceId: string) {
  return admin.firestore().doc(`spaces/${spaceId}/spaceSettings/default`);
}

function activityLogsCollection(spaceId: string) {
  return admin.firestore().collection(`spaces/${spaceId}/activityLogs`);
}

async function getStoredOAuth(spaceId: string) {
  const snapshot = await settingsRef(spaceId).get();
  return snapshot.data()?.youtubeOAuth as
    | {
        accessToken?: string;
        refreshToken?: string;
        expiryDate?: number;
      }
    | undefined;
}

async function sendInviteEmailViaResend(input: {
  to: string;
  inviteLink: string;
  spaceName: string;
}) {
  const apiKey = process.env.RESEND_API_KEY;
  const fromEmail = process.env.INVITE_FROM_EMAIL;

  if (!apiKey || !fromEmail) {
    return { sent: false, reason: "missing_config" };
  }

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: fromEmail,
      to: [input.to],
      subject: `You’re invited to join ${input.spaceName} on Reverie`,
      html: `
        <div style="font-family:Inter,Arial,sans-serif;background:#05070d;color:#fff;padding:32px">
          <h1 style="font-size:28px;margin:0 0 16px">Join ${input.spaceName}</h1>
          <p style="font-size:16px;line-height:1.6;color:rgba(255,255,255,0.78)">
            You’ve been invited to a private Reverie space. Use the secure link below to sign in or create your account with the invited email.
          </p>
          <a href="${input.inviteLink}" style="display:inline-block;margin-top:20px;background:#fff;color:#05070d;padding:14px 22px;border-radius:999px;text-decoration:none;font-weight:600">
            Open Private Space
          </a>
          <p style="margin-top:20px;font-size:13px;color:rgba(255,255,255,0.5)">${input.inviteLink}</p>
        </div>
      `,
    }),
  });

  if (!response.ok) {
    const body = await response.text();
    throw new HttpsError("internal", `Invite email failed: ${body}`);
  }

  return { sent: true };
}

export const connectYouTubeAccount = onCall(
  { cors: true },
  async (request) => {
    const uid = requireAuth(request as CallableContext);
    const { spaceId } = request.data as { spaceId: string };
    await requireSpaceAdmin(spaceId, uid);

    const oauth2Client = buildOAuthClient();
    const url = oauth2Client.generateAuthUrl({
      access_type: "offline",
      prompt: "consent",
      scope: [
        "https://www.googleapis.com/auth/youtube.upload",
        "https://www.googleapis.com/auth/youtube.readonly",
      ],
      state: JSON.stringify({
        spaceId,
        uid,
        returnOrigin:
          request.rawRequest.headers.origin ??
          request.rawRequest.headers.referer?.split("/").slice(0, 3).join("/"),
      }),
    });

    return { url };
  },
);

export const handleYouTubeOAuthCallback = onRequest(
  {},
  async (request, response) => {
    const code = request.query.code;
    const state = request.query.state;
    if (typeof code !== "string" || typeof state !== "string") {
      response.status(400).send("Missing OAuth callback parameters.");
      return;
    }

    const parsedState = JSON.parse(state) as {
      spaceId: string;
      uid: string;
      returnOrigin?: string;
    };

    const oauth2Client = buildOAuthClient();
    const tokenResponse = await oauth2Client.getToken(code);
    oauth2Client.setCredentials(tokenResponse.tokens);

    const youtube = google.youtube({
      version: "v3",
      auth: oauth2Client,
    });

    const channelResponse = await youtube.channels.list({
      mine: true,
      part: ["id", "snippet"],
    });

    const channel = channelResponse.data.items?.[0];
    const channelId = channel?.id ?? null;
    const channelTitle = channel?.snippet?.title ?? "Connected YouTube Channel";

    await settingsRef(parsedState.spaceId).set(
      {
        youtubeConnected: true,
        youtubeChannelId: channelId,
        youtubeChannelTitle: channelTitle,
        youtubeConnectedAt: admin.firestore.FieldValue.serverTimestamp(),
        youtubeConnectedBy: parsedState.uid,
        youtubeLastSyncedAt: admin.firestore.FieldValue.serverTimestamp(),
        youtubeOAuth: {
          accessToken: tokenResponse.tokens.access_token ?? null,
          refreshToken: tokenResponse.tokens.refresh_token ?? null,
          expiryDate: tokenResponse.tokens.expiry_date ?? null,
          tokenType: tokenResponse.tokens.token_type ?? null,
          scope: tokenResponse.tokens.scope ?? null,
        },
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      },
      { merge: true },
    );

    await activityLogsCollection(parsedState.spaceId).add({
      spaceId: parsedState.spaceId,
      actorUserId: parsedState.uid,
      actorRole: "space_admin",
      action: "youtube.connected",
      targetType: "youtube_channel",
      targetId: channelId,
      metadata: {
        channelTitle,
      },
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    const origin = "*";
    response
      .status(200)
      .setHeader("Content-Type", "text/html; charset=utf-8")
      .send(`
        <!doctype html>
        <html>
          <body style="background:#05070d;color:white;font-family:sans-serif;display:flex;align-items:center;justify-content:center;height:100vh;">
            <script>
              if (window.opener) {
                window.opener.postMessage(
                  {
                    type: "youtube-oauth-success",
                    channelId: ${JSON.stringify(channelId)},
                    channelTitle: ${JSON.stringify(channelTitle)}
                  },
                  ${JSON.stringify(origin)}
                );
                window.close();
              }
            </script>
            <div>YouTube connected. You can close this window.</div>
          </body>
        </html>
      `);
  },
);

export const refreshYouTubeToken = onCall(
  { cors: true },
  async (request) => {
    const uid = requireAuth(request as CallableContext);
    const { spaceId } = request.data as { spaceId: string };
    await requireSpaceAdmin(spaceId, uid);

    const stored = await getStoredOAuth(spaceId);
    if (!stored?.refreshToken) {
      throw new HttpsError("failed-precondition", "No refresh token stored.");
    }

    const oauth2Client = buildOAuthClient();
    oauth2Client.setCredentials({
      refresh_token: stored.refreshToken,
    });

    const refreshed = await oauth2Client.refreshAccessToken();
    await settingsRef(spaceId).set(
      {
        youtubeOAuth: {
          accessToken: refreshed.credentials.access_token ?? stored.accessToken ?? null,
          refreshToken: stored.refreshToken,
          expiryDate: refreshed.credentials.expiry_date ?? null,
          tokenType: refreshed.credentials.token_type ?? null,
          scope: refreshed.credentials.scope ?? null,
        },
        youtubeLastSyncedAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      },
      { merge: true },
    );
    return {
      expiryDate: refreshed.credentials.expiry_date ?? null,
    };
  },
);

export const revokeYouTubeAccess = onCall(
  { cors: true },
  async (request) => {
    const uid = requireAuth(request as CallableContext);
    const { spaceId } = request.data as { spaceId: string };
    await requireSpaceAdmin(spaceId, uid);

    const ref = settingsRef(spaceId);
    const settings = await ref.get();
    const refreshToken = settings.data()?.youtubeOAuth?.refreshToken as string | undefined;

    if (refreshToken) {
      const oauth2Client = buildOAuthClient();
      oauth2Client.setCredentials({ refresh_token: refreshToken });
      await oauth2Client.revokeCredentials().catch(() => undefined);
    }

    await ref.set(
      {
        youtubeConnected: false,
        youtubeChannelId: admin.firestore.FieldValue.delete(),
        youtubeChannelTitle: admin.firestore.FieldValue.delete(),
        youtubeConnectedAt: admin.firestore.FieldValue.delete(),
        youtubeConnectedBy: admin.firestore.FieldValue.delete(),
        youtubeLastSyncedAt: admin.firestore.FieldValue.delete(),
        youtubeOAuth: admin.firestore.FieldValue.delete(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      },
      { merge: true },
    );

    return { revoked: true };
  },
);

export const uploadVideoToYouTube = onCall(
  { cors: true },
  async (request) => {
    const uid = requireAuth(request as CallableContext);
    const {
      spaceId,
      title,
      description,
      mimeType,
      base64File,
      collectionId,
      categoryId,
      customSeasonId,
      dateOfMemory,
      thumbnailUrl,
      bannerImageUrl,
      tags,
      location,
      featured,
      playbackOrder,
    } = request.data as {
      spaceId: string;
      title: string;
      description: string;
      mimeType: string;
      base64File: string;
      collectionId?: string;
      categoryId?: string;
      customSeasonId?: string;
      dateOfMemory?: string;
      thumbnailUrl?: string;
      bannerImageUrl?: string;
      tags?: string[];
      location?: string;
      featured?: boolean;
      playbackOrder?: number;
    };

    await requireSpaceAdmin(spaceId, uid);

    const settings = await settingsRef(spaceId).get();
    const stored = settings.data()?.youtubeOAuth;
    if (!stored?.refreshToken) {
      throw new HttpsError("failed-precondition", "YouTube account is not connected.");
    }

    const oauth2Client = buildOAuthClient();
    oauth2Client.setCredentials({
      refresh_token: stored.refreshToken,
    });

    const youtube = google.youtube({
      version: "v3",
      auth: oauth2Client,
    });

    // For production, use resumable upload with temporary storage and streams.
    const buffer = Buffer.from(base64File, "base64");

    const response = await youtube.videos.insert({
      part: ["snippet", "status"],
      requestBody: {
        snippet: {
          title,
          description,
        },
        status: {
          privacyStatus: "private",
        },
      },
      media: {
        mimeType,
        body: Readable.from(buffer),
      },
    });

    const videoId = response.data.id;
    if (!videoId) {
      throw new HttpsError("internal", "YouTube did not return a video ID.");
    }

    const mediaAssetRef = admin.firestore().collection(`spaces/${spaceId}/mediaAssets`).doc();
    const mediaItemRef = admin.firestore().collection(`spaces/${spaceId}/mediaItems`).doc();
    const settingsData = settings.data();

    await mediaAssetRef.set({
      spaceId,
      assetType: "video",
      provider: "youtube",
      providerAssetId: videoId,
      originalFilename: title,
      playbackUrl: `https://www.youtube.com/watch?v=${videoId}`,
      streamingUrl: `https://www.youtube.com/embed/${videoId}`,
      downloadUrl: `https://www.youtube.com/watch?v=${videoId}`,
      metadata: {
        privacyStatus: "private",
        channelId: settingsData?.youtubeChannelId ?? null,
        channelTitle: settingsData?.youtubeChannelTitle ?? null,
      },
      createdBy: uid,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    await mediaItemRef.set({
      spaceId,
      type: "video",
      title,
      slug: title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, ""),
      description,
      collectionId: collectionId ?? null,
      categoryId: categoryId ?? null,
      customSeasonId: customSeasonId ?? null,
      autoYearSeason: dateOfMemory ? Number(dateOfMemory.slice(0, 4)) : null,
      dateOfMemory: dateOfMemory ?? null,
      thumbnailUrl: thumbnailUrl ?? "",
      bannerImageUrl: bannerImageUrl ?? "",
      mediaAssetId: mediaAssetRef.id,
      youtubeVideoId: videoId,
      durationSeconds: response.data?.processingDetails?.processingProgress?.partsTotal ?? 0,
      episodeNumber: null,
      featured: Boolean(featured),
      tags: Array.isArray(tags) ? tags : [],
      location: location ?? null,
      playbackOrder: playbackOrder ?? 1,
      createdBy: uid,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      published: true,
      publishedAt: admin.firestore.FieldValue.serverTimestamp(),
      visibility: "private",
    });

    await activityLogsCollection(spaceId).add({
        spaceId,
        actorUserId: uid,
        actorRole: "space_admin",
        action: "media.youtube_uploaded",
        targetType: "youtube_video",
        targetId: videoId,
        metadata: {
          title,
          privacyStatus: "private",
          mediaAssetId: mediaAssetRef.id,
          mediaItemId: mediaItemRef.id,
        },
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
      });

    return {
      videoId,
      privacyStatus: "private",
      mediaAssetId: mediaAssetRef.id,
      mediaItemId: mediaItemRef.id,
      channelTitle: settingsData?.youtubeChannelTitle ?? null,
    };
  },
);

export const sendInviteEmail = onCall(
  { cors: true },
  async (request) => {
    const uid = requireAuth(request as CallableContext);
    const { spaceId, email, inviteLink } = request.data as {
      spaceId: string;
      email: string;
      inviteLink: string;
    };

    await requireSpaceAdmin(spaceId, uid);

    const spaceSnapshot = await admin.firestore().doc(`spaces/${spaceId}`).get();
    const spaceName = String(spaceSnapshot.data()?.name ?? "your private space");

    const result = await sendInviteEmailViaResend({
      to: email,
      inviteLink,
      spaceName,
    });

    await activityLogsCollection(spaceId).add({
      spaceId,
      actorUserId: uid,
      actorRole: "space_admin",
      action: "invite.email_sent",
      targetType: "invite_email",
      targetId: email,
      metadata: {
        inviteLink,
        provider: "resend",
        sent: result.sent,
      },
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    return result;
  },
);

export const deleteMediaItem = onCall(
  { cors: true },
  async (request) => {
    const uid = requireAuth(request as CallableContext);
    const { spaceId, mediaId, mediaAssetId } = request.data as {
      spaceId: string;
      mediaId: string;
      mediaAssetId: string;
    };

    await requireSpaceAdmin(spaceId, uid);

    const mediaRef = admin.firestore().doc(`spaces/${spaceId}/mediaItems/${mediaId}`);
    const mediaAssetRef = admin.firestore().doc(`spaces/${spaceId}/mediaAssets/${mediaAssetId}`);
    const [mediaSnapshot, mediaAssetSnapshot] = await Promise.all([mediaRef.get(), mediaAssetRef.get()]);

    if (!mediaSnapshot.exists) {
      return { deleted: true };
    }

    const stored = await getStoredOAuth(spaceId);
    const providerAssetId = String(mediaAssetSnapshot.data()?.providerAssetId ?? "");

    if (stored?.refreshToken && providerAssetId) {
      const oauth2Client = buildOAuthClient();
      oauth2Client.setCredentials({
        refresh_token: stored.refreshToken,
      });

      const youtube = google.youtube({
        version: "v3",
        auth: oauth2Client,
      });

      await youtube.videos.delete({
        id: providerAssetId,
      }).catch(() => undefined);
    }

    await Promise.all([mediaRef.delete(), mediaAssetRef.delete()]);

    await activityLogsCollection(spaceId).add({
      spaceId,
      actorUserId: uid,
      actorRole: "space_admin",
      action: "media.deleted",
      targetType: "media_item",
      targetId: mediaId,
      metadata: {
        mediaAssetId,
        providerAssetId,
      },
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    return { deleted: true };
  },
);
