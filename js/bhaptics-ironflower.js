/**
 * ironflower × bHaptics 绑定配置
 *
 * Portal 模型：一个应用（App）对应一套触觉事件；本 Web 体验只绑定 hit 动作。
 * 修改 pattern 请在 Portal → Events → hit 里改并 Deploy，无需改网页代码。
 */

export const IRONFLOWER_BHAPTICS = {
  appName: "ironflower",
  appId: "6a1c1014f44e4d49cb99560a",
  apiKey: "dDN3wkj53BwCRGCi6yim",
  /** Portal Events 里定义的事件名 */
  event: "hiut",
  /** Player Labs → Device Index（与 Python 配置一致） */
  deviceIndex: { right: 0, left: 1 },
  /** 直连马达脉冲（hit-trigger 直连测试） */
  directPulse: {
    intensity: 100,
    durationMs: 250,
  },
  /** 表演模式命中：时长为 directPulse 的一半 */
  directPulsePerformance: {
    intensity: 100,
    durationMs: 125,
  },
  /** 练习模式命中：时长为 directPulse 的一半 */
  directPulsePractice: {
    intensity: 100,
    durationMs: 125,
  },
};
