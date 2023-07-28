export function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function getActivity(activityName: string) {
  let activity;

  Java.choose(activityName, {
    onMatch: (obj) => {
      activity = obj;
    },
    onComplete: () => {},
  });

  return activity as unknown as Java.Wrapper;
}

export async function ensureModulesInitialized(...modules: string[]) {
  while (modules.length > 0) {
    const md = modules.pop();
    if (!md) return;

    if (!Module.findBaseAddress(md)) {
      console.log(`Waiting for ${md} to be initialized...`);
      await sleep(100);
      modules.push(md);
    }
  }
}

export function JavaIl2CppPerform(fn: () => void) {
  Java.perform(() => Il2Cpp.perform(fn));
}
