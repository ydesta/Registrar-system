export class RegistrarWorkFlow {
  public id: number;
  public parentId: string;
  public previousStatus: number;
  public currentStatus: number;
  public actionDate: Date;
  public actionBy: string;
  public description: string;
  public actionTableType: number;
}
