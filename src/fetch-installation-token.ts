import { getOctokit } from "@actions/github";
import { createAppAuth } from "@octokit/auth-app";
import { request } from "@octokit/request";

export const fetchInstallationToken = async ({
  appId,
  githubApiUrl,
  installationId,
  owner,
  permissions,
  privateKey,
  repo,
  organization,
}: Readonly<{
  appId: string;
  githubApiUrl: URL;
  installationId?: number;
  owner: string;
  permissions?: Record<string, string>;
  privateKey: string;
  repo: string;
  organization?: string;
}>): Promise<string> => {
  const app = createAppAuth({
    appId,
    privateKey,
    request: request.defaults({
      baseUrl: githubApiUrl
        .toString()
        // Remove optional trailing `/`.
        .replace(/\/$/, ""),
    }),
  });

  const authApp = await app({ type: "app" });
  const octokit = getOctokit(authApp.token);

  if (installationId === undefined) {
    if (organization === undefined) {
      try {
        ({
          data: { id: installationId },
        } = await octokit.rest.apps.getRepoInstallation({ owner, repo }));
      } catch (error: unknown) {
        throw new Error(
          "Could not get repo installation. Is the app installed on this repo?",
          { cause: error },
        );
      }
    } else {
      try {
        ({
          data: { id: installationId },
        } = await octokit.rest.apps.getOrgInstallation({ org: organization }));
      } catch (error: unknown) {
        throw new Error(
          "Could not get organization installation. Is the app installed on this organization?",
          { cause: error },
        );
      }
    }
  }

  try {
    const { data: installation } =
      await octokit.rest.apps.createInstallationAccessToken({
        installation_id: installationId,
        permissions,
      });
    return installation.token;
  } catch (error: unknown) {
    throw new Error("Could not create installation access token.", {
      cause: error,
    });
  }
};
