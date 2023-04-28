import { Injectable } from "@angular/core";

@Injectable({
  providedIn: "root",
})
export class PrintCustomReacService {
  public reacEditable = {
      tx_max: true,
      tx_min: true,
      ty_max: true,
      ty_min: true,
      tz_max: true,
      tz_min: true,
      mx_max: true,
      mx_min: true,
      my_max: true,
      my_min: true,
      mz_max: true,
      mz_min: true
    };

  constructor() {}

}
