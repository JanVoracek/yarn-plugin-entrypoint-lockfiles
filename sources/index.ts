import { Cache, Project, structUtils, ThrowReport } from '@yarnpkg/core';
import { ppath, xfs } from '@yarnpkg/fslib';
import * as globrex from 'globrex';

import type { Filename, PortablePath } from '@yarnpkg/fslib';
import type { Configuration, Hooks, Report, Workspace } from '@yarnpkg/core';

const afterAllInstalled: Hooks['afterAllInstalled'] = async (project, options) => {
  await options.report.startTimerPromise('Entrypoint lockfiles', () =>
    generateLockfiles(project.configuration, project, options.report)
  );
};

async function generateLockfiles(configuration: Configuration, project: Project, report: Report) {
  const cache = await Cache.find(configuration, { immutable: true });
  const entrypoints = await getEntrypoints(project);

  await Promise.all(
    entrypoints.map(async workspace => {
      const lockfileName = `yarn.${structUtils.slugifyIdent(workspace.locator)}.lock` as Filename;
      const lockfilePath = ppath.join(project.cwd, lockfileName);

      const lockfile = await generateLockfile(configuration, workspace.cwd, cache);
      await xfs.writeFilePromise(lockfilePath, lockfile);
      report.reportInfo(null, `${structUtils.stringifyIdent(workspace.locator)} => ${lockfileName}`);
    })
  );
}

async function getEntrypoints(project: Project) {
  const rootWorkspace = project.workspacesByCwd.get(project.cwd);
  const entrypoints: string[] = rootWorkspace.manifest.raw.workspaces?.entrypoints || [];
  const entrypointPatterns = entrypoints.map(glob => globrex(glob, { globstar: true, extended: true }).regex);

  const isEntrypoint = (workspace: Workspace) => entrypointPatterns.some(regexp => regexp.test(workspace.relativeCwd));
  return project.workspaces.filter(isEntrypoint);
}

async function generateLockfile(configuration: Configuration, workspaceCwd: PortablePath, cache: Cache) {
  // Always create a new instance of Project to avoid interference of its internal state
  const { project, workspace } = await Project.find(configuration, workspaceCwd);

  // Focus on only one workspace - I'm not sure whether this can cause some problems but it looks like it works
  project.workspaces = [workspace];

  await project.resolveEverything({ cache, report: new ThrowReport() });
  return project.generateLockfile();
}

export default { hooks: { afterAllInstalled } };
