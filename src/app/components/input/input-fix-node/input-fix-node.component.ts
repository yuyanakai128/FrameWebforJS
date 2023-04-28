import { Component, OnInit, ViewChild } from "@angular/core";
import { InputFixNodeService } from "./input-fix-node.service";
import { DataHelperModule } from "../../../providers/data-helper.module";
import { ThreeService } from "../../three/three.service";
import { SheetComponent } from "../sheet/sheet.component";
import pq from "pqgrid";
import { AppComponent } from "src/app/app.component";
import { TranslateService } from "@ngx-translate/core";

@Component({
  selector: "app-input-fix-node",
  templateUrl: "./input-fix-node.component.html",
  styleUrls: ["./input-fix-node.component.scss", "../../../app.component.scss"],
})
export class InputFixNodeComponent implements OnInit {
  @ViewChild("grid") grid: SheetComponent;

  private ROWS_COUNT = 15;
  private page = 1;
  private dataset = [];

  private columnKeys3D: string[] = ['n', 'tx', 'ty', 'tz', 'rx', 'ry', 'rz'];
  private columnKeys2D: string[] = ['n', 'tx', 'ty', 'rz'];
  private columnHeaders3D = [
    {
      title: this.translate.instant("input.input-fix-node.node"),
      align: "center",
      colModel: [
        {
          title: this.translate.instant("input.input-fix-node.No"),
          align: "center",
          dataType: "string",
          dataIndx: this.columnKeys3D[0],
          sortable: false,
          width: 30,
        },
      ],
    },
    {
      title: this.translate.instant(
        "input.input-fix-node.displacementRestraint"
      ),
      align: "center",
      colModel: [
        {
          title: this.translate.instant("input.input-fix-node.x_direction"),
          dataType: "float",
          dataIndx: this.columnKeys3D[1],
          sortable: false,
          width: 100,
        },
        {
          title: this.translate.instant("input.input-fix-node.y_direction"),
          dataType: "float",
          dataIndx: this.columnKeys3D[2],
          sortable: false,
          width: 100,
        },
        {
          title: this.translate.instant("input.input-fix-node.z_direction"),
          dataType: "float",
          dataIndx: this.columnKeys3D[3],
          sortable: false,
          width: 100,
        },
      ],
    },
    {
      title: this.translate.instant("input.input-fix-node.rotationalRestraint"),
      align: "center",
      colModel: [
        {
          title: this.translate.instant("input.input-fix-node.x_around"),
          dataType: "float",
          dataIndx: this.columnKeys3D[4],
          sortable: false,
          width: 100,
        },
        {
          title: this.translate.instant("input.input-fix-node.y_around"),
          dataType: "float",
          dataIndx: this.columnKeys3D[5],
          sortable: false,
          width: 100,
        },
        {
          title: this.translate.instant("input.input-fix-node.z_around"),
          dataType: "float",
          dataIndx: this.columnKeys3D[6],
          sortable: false,
          width: 100,
        },
      ],
    },
  ];
  private columnHeaders2D = [
    {
      title: this.translate.instant("input.input-fix-node.node"),
      align: "center",
      colModel: [
        {
          title: this.translate.instant("input.input-fix-node.No"),
          align: "center",
          dataType: "string",
          dataIndx: this.columnKeys2D[0],
          sortable: false,
          width: 30,
        },
      ],
    },
    {
      title: this.translate.instant(
        "input.input-fix-node.displacementRestraint"
      ),
      align: "center",
      colModel: [
        {
          title: this.translate.instant("input.input-fix-node.x_direction"),
          dataType: "float",
          dataIndx: this.columnKeys2D[1],
          sortable: false,
          width: 100,
        },
        {
          title: this.translate.instant("input.input-fix-node.y_direction"),
          dataType: "float",
          dataIndx: this.columnKeys2D[2],
          sortable: false,
          width: 100,
        },
      ],
    },
    {
      title: this.translate.instant("input.input-fix-node.rotationalRestraint"),
      align: "center",
      colModel: [
        {
          title: " (kN・m/rad)",
          dataType: "float",
          dataIndx: this.columnKeys2D[3],
          sortable: false,
          width: 100,
        },
      ],
    },
  ];

  private currentRow: number;
  private currentColumn: string;

  constructor(
    private data: InputFixNodeService,
    private helper: DataHelperModule,
    private app: AppComponent,
    private three: ThreeService,
    private translate: TranslateService
  ) {
    this.currentRow = null;
    this.currentColumn = null;

  }

  ngOnInit() {
    this.ROWS_COUNT = this.rowsCount();
    this.loadPage(1, this.ROWS_COUNT);
    this.three.ChangeMode("fix_nodes");
    this.three.ChangePage(1);
  }

  //　pager.component からの通知を受け取る
  onReceiveEventFromChild(eventData: number) {
    this.dataset.splice(0);
    this.loadPage(eventData, this.ROWS_COUNT);
    this.grid.refreshDataAndView();
    this.three.ChangePage(eventData);
  }

  //
  loadPage(currentPage: number, row: number) {
    for (let i = this.dataset.length + 1; i <= row; i++) {
      const fix_node = this.data.getFixNodeColumns(currentPage, i);
      this.dataset.push(fix_node);
    }
    this.page = currentPage;
  }

  // 表の高さを計算する
  private tableHeight(): string {
    const containerHeight = this.app.getDialogHeight() - 70; // pagerの分減じる
    return containerHeight.toString();
  }
  // 表高さに合わせた行数を計算する
  private rowsCount(): number {
    const containerHeight = this.app.getDialogHeight();
    return Math.round(containerHeight / 30);
  }

  private colModel(): any {
    this.helper.dimension === 3 ? this.columnHeaders3D : this.columnHeaders2D;
  }

  // グリッドの設定
  options: pq.gridT.options = {
    showTop: false,
    reactive: true,
    sortable: false,
    locale: "jp",
    height: this.tableHeight(),
    numberCell: {
      show: false, // 行番号
    },
    colModel:
      this.helper.dimension === 3 ? this.columnHeaders3D : this.columnHeaders2D,
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
        this.loadPage(this.page, dataV + this.ROWS_COUNT);
        this.grid.refreshDataAndView();
      }
    },
    selectEnd: (evt, ui) => {
      const range = ui.selection.iCells.ranges;
      const row = range[0].r1 + 1;
      const columnList = this.getColumnList(this.helper.dimension);
      const column = columnList[range[0].c1];
      if (this.currentRow !== row || this.currentColumn !== column ){
        //選択行の変更があるとき，ハイライトを実行する
        this.three.selectChange("fix_nodes", row, column);
      }
      this.currentRow = row;
      this.currentColumn = column;
    },
    change: (evt, ui) => {
      // copy&pasteで入力した際、超過行が消えてしまうため、addListのループを追加.
      for (const target of ui.addList) {
        const no: number = target.rowIndx;
        const node = this.data.getFixNodeColumns(this.page, no + 1);
        node["n"] = target.newRow.n != undefined ? target.newRow.n : "";
        node["tx"] = target.newRow.tx != undefined ? target.newRow.tx : "";
        node["ty"] = target.newRow.ty != undefined ? target.newRow.ty : "";
        node["tz"] = target.newRow.tz != undefined ? target.newRow.tz : "";
        node["rx"] = target.newRow.rx != undefined ? target.newRow.rx : "";
        node["ry"] = target.newRow.ry != undefined ? target.newRow.ry : "";
        node["rz"] = target.newRow.rz != undefined ? target.newRow.rz : "";
        this.dataset.splice(no, 1, node);
      }
      this.three.changeData("fix_nodes", this.page);

      // ハイライトの処理を再度実行する
      const row = ui.updateList[0].rowIndx + 1;
      let column: string;
      const columnList = this.getColumnList(this.helper.dimension);
      for (const key of columnList) {
        if (key in ui.updateList[0].newRow) {
          column = key;
          break;
        }
      }
      this.three.selectChange("fix_nodes", row, column);
    },
  };

  width = this.helper.dimension === 3 ? 712 : 412;

  private getColumnList (dimension): string[] {
    if (dimension === 3) {
      return this.columnKeys3D;
    } else {
      return this.columnKeys2D;
    }
  }
}
