import test from "node:test";
import assert from "node:assert/strict";
import { detectGitHost, getGitStatus } from "../git-status.ts";

test("git status supports disabling extension git polling", () => {
  assert.deepEqual(getGitStatus("main", "off"), {
    branch: "main",
    staged: 0,
    unstaged: 0,
    untracked: 0,
  });
});

test("detectGitHost recognizes known hosts over SSH and HTTPS", () => {
  assert.equal(detectGitHost("git@github.com:owner/repo.git"), "github");
  assert.equal(detectGitHost("https://github.com/owner/repo.git"), "github");
  assert.equal(detectGitHost("ssh://git@gitlab.com/owner/repo.git"), "gitlab");
  assert.equal(detectGitHost("https://gitlab.com/owner/repo"), "gitlab");
  assert.equal(detectGitHost("git@bitbucket.org:owner/repo.git"), "bitbucket");
  assert.equal(detectGitHost("https://user@bitbucket.org/owner/repo.git"), "bitbucket");
});

test("detectGitHost normalizes www and sub-domains", () => {
  assert.equal(detectGitHost("https://www.github.com/owner/repo"), "github");
  assert.equal(detectGitHost("git@ssh.github.com:owner/repo.git"), "github");
});

test("detectGitHost treats unknown or self-hosted remotes as a generic host", () => {
  assert.equal(detectGitHost("git@git.example.com:owner/repo.git"), "other");
  assert.equal(detectGitHost("https://gitea.mycorp.dev/owner/repo.git"), "other");
  assert.equal(detectGitHost("/srv/git/local.git"), "other");
});

test("detectGitHost returns null when there is no remote", () => {
  assert.equal(detectGitHost(null), null);
  assert.equal(detectGitHost(""), null);
  assert.equal(detectGitHost("   "), null);
});
