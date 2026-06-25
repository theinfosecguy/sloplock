import * as github from "@actions/github";
import { stickyCommentMarker } from "../reporting/markdown.js";

export async function upsertStickyComment(input: {
  token: string;
  body: string;
}): Promise<"created" | "updated" | "skipped"> {
  const pullRequest = github.context.payload.pull_request;
  if (pullRequest === undefined) {
    return "skipped";
  }

  const octokit = github.getOctokit(input.token);
  const { owner, repo } = github.context.repo;
  const issueNumber = pullRequest.number;
  const comments = await octokit.rest.issues.listComments({
    owner,
    repo,
    issue_number: issueNumber,
    per_page: 100
  });
  const existing = comments.data.find((comment) =>
    comment.body?.includes(stickyCommentMarker)
  );

  if (existing === undefined) {
    await octokit.rest.issues.createComment({
      owner,
      repo,
      issue_number: issueNumber,
      body: input.body
    });
    return "created";
  }

  await octokit.rest.issues.updateComment({
    owner,
    repo,
    comment_id: existing.id,
    body: input.body
  });
  return "updated";
}
