import { AcadamicProgramme } from "./acadamic-programme.model";

export class ResponseDtos {
  public data: AcadamicProgramme[];
  public status: any;
  public error: any;
  public ex: any;
}
