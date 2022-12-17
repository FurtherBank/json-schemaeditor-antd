/**
 * 负责管理用户与编辑器的交互
 */
export class CpuInteraction {
  constructor(public setDrawer: (route: string[], field: string | undefined) => void) {}
}
