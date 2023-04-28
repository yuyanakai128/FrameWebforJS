import { Component, OnInit, ViewChild } from "@angular/core";
import { InputMembersService } from "../input-members/input-members.service";
import { InputNoticePointsService } from "./input-notice-points.service";
import { DataHelperModule } from "../../../providers/data-helper.module";
import { ThreeService } from "../../three/three.service";
import { SheetComponent } from "../sheet/sheet.component";
import pq from "pqgrid";
import { AppComponent } from "src/app/app.component";
import { TranslateService } from "@ngx-translate/core";

@Component({
  selector: "app-input-notice-points",
  templateUrl: "./input-notice-points.component.html",
  styleUrls: [
    "./input-notice-points.component.scss",
    "../../../app.component.scss",
  ],
})
export class InputNoticePointsComponent implements OnInit {
  @ViewChild("grid") grid: SheetComponent;

  private dataset = [];
  private columnKeys = ['m', 'len'];
  private columnHeaders: any = [
    {
      title: this.translate.instant("input.input-notice-points.memberNo"),
      dataType: "string",
      dataIndx: this.columnKeys[0],
      sortable: false,
      minwidth: 10,
      width: 10,
    },
    {
      title: this.translate.instant("input.input-notice-points.distance"),
      dataType: "float",
      format: "#.000",
      dataIndx: this.columnKeys[1],
      sortable: false,
      width: 80,
      editable: false,
      style: { background: "#dae6f0" },
    },
    { 
      title: this.translate.instant("input.input-notice-points.distance_from_node_i"),
      colModel: [] },
  ];

  private ROWS_COUNT = 15;

  private currentIndex: string;

  constructor(
    private data: InputNoticePointsService,
    private member: InputMembersService,
    private helper: DataHelperModule,
    private app: AppComponent,
    private three: ThreeService,
    private translate: TranslateService
  ) {
    for (let i = 1; i <= this.data.NOTICE_POINTS_COUNT; i++) {
      // this.columnKeysの情報追加
      this.columnKeys.push('L' + i.toString());
      // this.columnHeadersの情報追加
      const id = "L" + i;
      this.columnHeaders[2].colModel.push({
        title: id,
        dataType: "float",
        format: "#.000",
        dataIndx: id,
        sortable: false,
        width: 80,
      });
    }
    this.currentIndex = null;
  }

  ngOnInit() {
    this.ROWS_COUNT = this.rowsCount();
    // three.js にモードの変更を通知する
    this.three.ChangeMode("notice_points");
  }

  // 指定行row 以降のデータを読み取る
  private loadData(row: number): void {
    for (let i = this.dataset.length + 1; i <= row; i++) {
      const notice_points = this.data.getNoticePointsColumns(i);
      const m: string = notice_points["m"];
      if (m !== "") {
        const l: number = this.member.getMemberLength(m);
        notice_points["len"] = l != null ? l.toFixed(3) : "";
      }
      this.dataset.push(notice_points);
    }
  }

  // 表の高さを計算する
  private tableHeight(): string {
    const containerHeight = this.app.getDialogHeight();
    return containerHeight.toString();
  }
  // 表高さに合わせた行数を計算する
  private rowsCount(): number {
    const containerHeight = this.app.getDialogHeight();
    return Math.round(containerHeight / 30);
  }

  // グリッドの設定
  options: pq.gridT.options = {
    showTop: false,
    reactive: true,
    sortable: false,
    scrollModel: {
      horizontal: true,
    },
    locale: "jp",
    height: this.tableHeight(),
    numberCell: {
      show: false, // 行番号
    },
    colModel: this.columnHeaders,
    dataModel: {
      data: this.dataset,
    },
    beforeTableView: (evt, ui) => {
      const finalV = ui.finalV;
      const dataV = this.dataset.length;
      if (ui.initV == null) {
        return;
      }
      if (finalV >= dataV - 1) {
        this.loadData(dataV + this.ROWS_COUNT);
        this.grid.refreshDataAndView();
      }
    },
    selectEnd: (evt, ui) => {
      const range = ui.selection.iCells.ranges;
      const row = range[0].r1 + 1;
      const column = this.columnKeys[range[0].c1];
      if (this.currentIndex !== row){
        //選択行の変更があるとき，ハイライトを実行する
        this.three.selectChange("notice-points", row, column);
      }
      this.currentIndex = row;
    },
    change: (evt, ui) => {
      const changes = ui.updateList;
      for (const target of changes) {
        const row: number = target.rowIndx;
        if (!("m" in target.newRow)) {
          continue;
        }
        const m: string = target.newRow["m"];
        if (m === void 0) {
          this.dataset[row]["m"] = "";
          this.dataset[row]["len"] = "";
        } else {
          const l: number = this.member.getMemberLength(m);
          this.dataset[row]["len"] = l != null ? l : null;
        }
        this.grid.refreshDataAndView();
      }
      // copy&pasteで入力した際、超過行が消えてしまうため、addListのループを追加.
      for (const target of ui.addList) {
        const no: number = target.rowIndx;
        const notice_points = this.data.getNoticePointsColumns(no + 1);
        const newRow = target.newRow;
        notice_points['m'] = (newRow.m != undefined) ? newRow.m : '';
        for (let num = 1; num <= this.data.NOTICE_POINTS_COUNT; num++) {
          const key = "L" + num.toString();
          notice_points[key] = (newRow[key] != undefined && key in newRow) ? newRow[key] : '';
        }
        // 部材長の情報を作成する. 
        if (newRow.m !== '') {
          const l: number = this.member.getMemberLength(newRow.m);
          notice_points['len'] = (l == null) ? null : l.toFixed(3);
        }
        this.dataset.splice(no, 1, notice_points);
      }
      this.three.changeData("notice-points");

      // ハイライト処理を再度実行する
      const row = changes[0].rowIndx + 1;
      let column: string; // 複数の時は左上に合わせる
      for (const key of this.columnKeys) {
        if (key in ui.updateList[0].newRow) {
          column = key;
          break;
        }
      }
      this.three.selectChange("notice-points", row, column);

    },
  };
}
