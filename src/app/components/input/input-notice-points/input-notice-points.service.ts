import { Injectable } from "@angular/core";
import { DataHelperModule } from "../../../providers/data-helper.module";

@Injectable({
  providedIn: "root",
})
export class InputNoticePointsService {
  public NOTICE_POINTS_COUNT = 20;
  public notice_points: any[];

  constructor(private helper: DataHelperModule) {
    this.clear();
  }

  public clear(): void {
    this.notice_points = new Array();
  }

  public getNoticePointsColumns(row: number): any {
    let result: any = null;

    for (const tmp of this.notice_points) {
      if (tmp["row"] === row) {
        result = tmp;
        break;
      }
    }

    // 対象データが無かった時 に処理
    if (result === null) {
      result = { row, m: "", len: "" };
      for (let i = 1; i <= this.NOTICE_POINTS_COUNT; i++) {
        result["L" + i] = "";
      }
      this.notice_points.push(result);
    } else {
      // データの不足を補う
      for (let i = 1; i <= this.NOTICE_POINTS_COUNT; i++) {
        if (!("L" + i in result)) {
          result["L" + i] = "";
        }
      }
    }
    return result;
  }

  public setNoticePointsJson(jsonData: {}): void {
    if (!("notice_points" in jsonData)) {
      return;
    }
    const js: any[] = jsonData["notice_points"];
    for (let i = 0; i < js.length; i++) {
      const item = js[i];
      const row: string = "row" in item ? item["row"] : (i + 1).toString();
      const m = item["m"];
      const Points: any[] = item.Points;
      const result = { row: row, m: m };
      for (let j = 0; j < Points.length; j++) {
        const key = "L" + (j + 1).toString();
        const pos: number = this.helper.toNumber(Points[j]);
        result[key] = pos === null ? "" : pos.toFixed(3);
      }
      this.notice_points.push(result);
    }
  }

  public getNoticePointsJson() {
    const result = new Array();

    for (const row of this.notice_points) {
      const r = row["row"];

      const m = this.helper.toNumber(row["m"]);
      if (m == null) {
        continue;
      }

      const points = new Array();
      for (let j = 1; j < this.NOTICE_POINTS_COUNT + 1; j++) {
        const key = "L" + j;
        if (key in row) {
          const pos: number = this.helper.toNumber(row[key]);
          if (pos != null) {
            points.push(pos);
          }
        }
      }

      result.push({
        row: r,
        m: row.m,
        Points: points,
      });
    }

    return result;
  }
}
