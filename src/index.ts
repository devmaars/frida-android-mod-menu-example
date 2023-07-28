import 'frida-il2cpp-bridge';
import { getActivity, JavaIl2CppPerform, ensureModulesInitialized } from './util.js';

const APP_MAIN_ACTIVITY = 'com.unity3d.player.UnityPlayerActivity';
const modules = ['libil2cpp.so', 'libunity.so', 'libmain.so'];

type Il2CppThis = Il2Cpp.Object | Il2Cpp.Class;

JavaIl2CppPerform(async () => {
  const MainActivity = await getActivity(APP_MAIN_ACTIVITY);
  const appExternalFilesDir = MainActivity.getApplicationContext().getExternalFilesDir('');

  await ensureModulesInitialized(...modules);
  Java.openClassFile(appExternalFilesDir + '/menu.dex').load();

  main().catch((e) => console.error(e));
});

async function main() {
  const MainActivity = await getActivity(APP_MAIN_ACTIVITY);

  const Menu = Java.use('com.maars.fmenu.Menu');
  const PInteger = Java.use('com.maars.fmenu.PInteger');
  const PBoolean = Java.use('com.maars.fmenu.PBoolean');

  const Assembly = Il2Cpp.domain.assembly('Assembly-CSharp');

  const Currency = Assembly.image.class('SYBO.Subway.Meta.Currency');
  const MovingTrain = Assembly.image.class('SYBO.Subway.MovingTrain');
  const WalletModel = Assembly.image.class('SYBO.Subway.Meta.WalletModel');
  const Achievement = Assembly.image.class('SYBO.Subway.Meta.Achievement');
  const UpgradesModel = Assembly.image.class('SYBO.Subway.Meta.UpgradesModel');
  const CharacterMotor = Assembly.image.class('SYBO.RunnerCore.Character.CharacterMotor');
  const ScoreMultiplierManager = Assembly.image.class('SYBO.Subway.ScoreMultiplierManager');

  /*
   * Create states for the menu
   */
  const currency = PInteger.of(0);
  const powerupLevel = PInteger.of(0);
  const isFreezeTrain = PBoolean.of(false);
  const scoreMultiplier = PInteger.of(0);
  const isFreeIAP = PBoolean.of(false);
  const isNoGravity = PBoolean.of(false);
  const isNoCollision = PBoolean.of(false);
  const isUnlockAllAchievements = PBoolean.of(false);
  const isNoBoundaries = PBoolean.of(false);

  /*
   * Creating the menu
   */
  const menu = Menu.$new(MainActivity);

  menu.startCollapse('Player');
  menu.Switch('No Gravity', isNoGravity);
  menu.Switch('No Collision', isNoCollision);
  menu.Switch('No Boundaries', isNoBoundaries);
  menu.endCollapse();

  menu.startCollapse('Gameplay');
  menu.Switch('Freeze Train', isFreezeTrain);
  menu.InputNum('Score Multiplier', scoreMultiplier);
  menu.endCollapse();

  menu.startCollapse('Unlockables');
  menu.SeekBar('Powerup Level', powerupLevel, 0, 6);
  menu.Switch('Unlock all achievements', isUnlockAllAchievements);
  menu.endCollapse();

  menu.startCollapse('Store');
  menu.InputNum('Currency', currency);
  menu.Switch("Free IAP's", isFreeIAP);
  menu.endCollapse();

  /*
   * Hooking methods
   */
  UpgradesModel.method('GetPowerupLevel').implementation = function (this: Il2CppThis, powerupId: Il2Cpp.String) {
    if (powerupLevel.get() > 0) return powerupLevel.get();
    return this.method('GetPowerupLevel').invoke(powerupId);
  };

  ScoreMultiplierManager.method('get_BaseMultiplierSum').implementation = function () {
    if (scoreMultiplier.get() > 0) return scoreMultiplier.get();
    return this.method('get_BaseMultiplierSum').invoke();
  };

  MovingTrain.method('Update').implementation = function () {
    if (isFreezeTrain.get()) return;
    this.method('Update').invoke();
  };

  Currency.method('get_IsIAP').implementation = function () {
    if (isFreeIAP.get()) return false;
    return this.method('get_IsIAP').invoke();
  };

  WalletModel.method('GetCurrency').implementation = function (this: Il2CppThis, type: number) {
    if (currency.get() > 0) return currency.get();
    return this.method('GetCurrency').invoke(type);
  };

  CharacterMotor.method('ApplyGravity').implementation = function () {
    if (isNoGravity.get()) return;
    this.method('ApplyGravity').invoke();
  };

  CharacterMotor.method('IsChangingLaneTowardsBoundary').implementation = function (
    this: Il2CppThis,
    direction: number,
  ) {
    if (isNoBoundaries.get()) return false;
    return this.method('IsChangingLaneTowardsBoundary').invoke(direction);
  };

  CharacterMotor.method('CheckFrontalImpact').implementation = function (this: Il2CppThis, impactState: Il2Cpp.Object) {
    if (isNoCollision.get()) return false;
    return this.method('CheckFrontalImpact').invoke(impactState);
  };

  CharacterMotor.method('CheckSideImpact').implementation = function (this: Il2CppThis, impactState: Il2Cpp.Object) {
    if (isNoCollision.get()) return false;
    return this.method('CheckSideImpact').invoke(impactState);
  };

  Achievement.method('get_IsTierCompleted').implementation = function () {
    if (isUnlockAllAchievements.get()) return true;
    return this.method('get_IsTierCompleted').invoke();
  };

  Java.scheduleOnMainThread(() => {
    menu.attach();
  });
}
