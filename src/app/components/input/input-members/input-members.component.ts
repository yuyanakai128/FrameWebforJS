import { Component, OnInit, ViewChild } from "@angular/core";
import { InputMembersService } from "./input-members.service";
import { InputElementsService } from "../input-elements/input-elements.service";
import { DataHelperModule } from "../../../providers/data-helper.module";
import { ThreeService } from "../../three/three.service";
import { SheetComponent } from "../sheet/sheet.component";
import pq from "pqgrid";
import { AppComponent } from "src/app/app.component";
import { TranslateService } from "@ngx-translate/core";

@Component({
  selector: "app-input-members",
  templateUrl: "./input-members.component.html",
  styleUrls: ["./input-members.component.scss", "../../../app.component.scss"],
})
export class InputMembersComponent implements OnInit {
  @ViewChild("grid") grid: SheetComponent;

  private dataset = [];
  private columnKeys = ['ni', 'nj', 'L', 'e', 'cg', 'n'];
  private columnHeaders3D = [
    {
      title: this.translate.instant("input.input-members.node"),
      align: "center",
      colModel: [
        {
          title: this.translate.instant("input.input-members.node_i"),
          dataType: "integer",
          dataIndx: this.columnKeys[0],
          sortable: false,
          minwidth: 10,
          width: 10,
        },
        {
          title: this.translate.instant("input.input-members.node_j"),
          dataType: "integer",
          dataIndx: this.columnKeys[1],
          sortable: false,
          minwidth: 10,
          width: 10,
        },
      ],
    },
    {
      title: this.translate.instant("input.input-members.distance"),
      align: "center",
      colModel: [
        {
          title: "(m)",
          dataType: "float",
          format: "#.000",
          dataIndx: this.columnKeys[2],
          sortable: false,
          width: 100,
          editable: false,
          style: { background: "#dae6f0" },
        },
      ],
    },
    {
      title: this.translate.instant("input.input-members.material"),
      align: "center",
      colModel: [
        {
          title: this.translate.instant("input.input-members.No"),
          dataType: "integer",
          dataIndx: this.columnKeys[3],
          sortable: false,
          minwidth: 10,
          width: 10,
        },
      ],
    },
    {
      title: this.translate.instant("input.input-members.codeAngle"),
      align: "center",
      colModel: [
        {
          title: "(°)",
          dataType: "float",
          dataIndx: this.columnKeys[4],
          sortable: false,
          width: 130,
        },
      ],
    },
    {
      title: this.translate.instant("input.input-members.material_name"),
      align: "center",
      dataType: "string",
      dataIndx: this.columnKeys[5],
      sortable: false,
      width: 100,
      editable: false,
      style: { background: "#dae6f0" },
    },
  ];
  private columnHeaders2D = [
    {
      title: this.translate.instant("input.input-members.node"),
      align: "center",
      colModel: [
        {
          title: this.translate.instant("input.input-members.node_i"),
          dataType: "integer",
          dataIndx: this.columnKeys[0],
          sortable: false,
          minwidth: 10,
          width: 10,
        },
        {
          title: this.translate.instant("input.input-members.node_j"),
          dataType: "integer",
          dataIndx: this.columnKeys[1],
          sortable: false,
          minwidth: 10,
          width: 10,
        },
      ],
    },
    {
      title: this.translate.instant("input.input-members.distance"),
      align: "center",
      colModel: [
        {
          title: "(m)",
          dataType: "float",
          format: "#.000",
          dataIndx: this.columnKeys[2],
          sortable: false,
          width: 100,
          editable: false,
          style: { background: "#dae6f0" },
        },
      ],
    },
    {
      title: this.translate.instant("input.input-members.material"),
      align: "center",
      colModel: [
        {
          title: this.translate.instant("input.input-members.No"),
          dataType: "integer",
          dataIndx: this.columnKeys[3],
          sortable: false,
          minwidth: 10,
          width: 10,
        },
      ],
    },
    {
      title: this.translate.instant("input.input-members.material_name"),
      align: "center",
      dataType: "string",
      dataIndx: this.columnKeys[5],
      sortable: false,
      width: 100,
      editable: false,
      style: { background: "#dae6f0" },
    },
  ];

  private ROWS_COUNT = 15;

  private currentIndex: string;

  constructor(
    private data: InputMembersService,
    private element: InputElementsService,
    private helper: DataHelperModule,
    private app: AppComponent,
    private three: ThreeService,
    private translate: TranslateService
  ) {

    this.currentIndex = null;

  }

  ngOnInit() {
    this.ROWS_COUNT = this.rowsCount();
    // three.js にモードの変更を通知する
    this.three.ChangeMode("members");
  }

  // 指定行row 以降のデータを読み取る
  private loadData(row: number): void {
    for (let i = this.dataset.length + 1; i <= row; i++) {
      const member = this.data.getMemberColumns(i);
      const m: string = member["id"];
      const e = (member.e !== null) ? member.e : undefined;
      if (m !== "") {
        const l: any = this.data.getMemberLength(m);
        member["L"] = l != null ? l.toFixed(3) : l;
        const name = this.element.getElementName(e);
        member["n"] = name != null ? name : "";
      }
      this.dataset.push(member);
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
    locale: "jp",
    height: this.tableHeight(),
    numberCell: {
      show: true, // 行番号
      width: 45,
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
        this.three.selectChange("members", row, '');
      }
      this.currentIndex = row;
    },
    change: (evt, ui) => {
      const changes = ui.updateList;
      for (const target of changes) {
        const row: number = target.rowIndx;
        if (
          !(
            "ni" in target.newRow ||
            "nj" in target.newRow ||
            "e" in target.newRow
          )
        ) {
          continue;
        }
        //const new_value = target.rowData;
        const member: {} = this.dataset[row];
        const m: string = member["id"];
        if (m === "") {
          continue;
        }
        const l: number = this.data.getMemberLength(m);
        const column = this.dataset[row];
        if (l != null) {
          column["L"] = l.toFixed(3);
          // this.grid.refreshDataAndView();
        } else {
          column["L"] = null;
        }
        const n: string =
          target.rowData.e === undefined
            ? ""
            : this.element.getElementName(target.rowData.e);
        if (n != null) {
          this.dataset[row]["n"] = n;
          this.grid.refreshDataAndView();
        }
      }
      for (const target of ui.addList) {
        const no: number = target.rowIndx;
        const newRow = target.newRow;
        const member = this.data.getMemberColumns(no + 1);
        member['ni'] = (newRow.ni !== undefined) ? newRow.ni : '';
        member['nj'] = (newRow.nj !== undefined) ? newRow.nj : '';
        member['e']  = (newRow.e  !== undefined) ? newRow.e  : '';
        member['cg'] = (newRow.cg !== undefined) ? newRow.cg : '';

        // 入力によって反映される値を設定
        if ( member['ni'] !== '' || member['nj'] !== '' ) {
          const l: number = this.data.getMemberLength(no.toString());
          member["L"] = (l == null) ? null : l.toFixed(3);
        }
        if (member['e'] !== '') {
          const EleName = this.element.getElementName(newRow.e);
          member["n"] = (EleName == '') ? '' : EleName;
        }
        this.dataset.splice(no, 1, member)
      }
      this.three.changeData("members");

      // ハイライト処理を再度実行する
      const row = changes[0].rowIndx + 1;
      this.three.selectChange("members", row, '');
    },
  };

  width = this.helper.dimension === 3 ? 580 : 450;
}
