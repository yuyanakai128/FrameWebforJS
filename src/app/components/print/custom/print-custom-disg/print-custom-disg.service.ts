import { Injectable } from "@angular/core";

@Injectable({
  providedIn: "root",
})
export class PrintCustomDisgService {

  public disgEditable = {
      dx_max: true,
      dx_min: true,
      dy_max: true,
      dy_min: true,
      dz_max: true,
      dz_min: true,
      rx_max: true,
      rx_min: true,
      ry_max: true,
      ry_min: true,
      rz_max: true,
      rz_min: true
  };

  constructor(){}
}
