import { Injectable } from "@angular/core";
import { InputDataService } from "src/app/providers/input-data.service";
import { SceneService } from "./scene.service";
import * as THREE from "three";
import { DataHelperModule } from "src/app/providers/data-helper.module";
//import { DeclareFunctionStmt } from "@angular/compiler";

import { ThreeNodesService } from "./geometry/three-nodes.service";
import { ThreeMembersService } from "./geometry/three-members.service";
import { ThreeFixNodeService } from "./geometry/three-fix-node.service";
import { ThreeFixMemberService } from "./geometry/three-fix-member.service";
import { ThreeJointService } from "./geometry/three-joint.service";
import { ThreePanelService } from "./geometry/three-panel.service";
import { ThreeNoticePointsService } from "./geometry/three-notice-points.service";
import { ThreeLoadService } from "./geometry/three-load/three-load.service";

import { ThreeDisplacementService } from "./geometry/three-displacement.service";
import { ThreeSectionForceService } from "./geometry/three-section-force/three-section-force.service";
import { ThreeReactService } from "./geometry/three-react.service";
import html2canvas from "html2canvas";
import { PrintService } from "../print/print.service";
import { PrintCustomThreeService } from "../print/custom/print-custom-three/print-custom-three.service";
import { ResultCombineFsecService } from "../result/result-combine-fsec/result-combine-fsec.service";
import { MaxMinService } from "./max-min/max-min.service";
import { MaxMinComponent } from "./max-min/max-min.component";

@Injectable({
  providedIn: "root",
})
export class ThreeService {
  public mode: string;
  private currentIndex: number;
  public canvasElement: HTMLCanvasElement;

  public selectedNumber: number;

  public canvasWidth: string;
  public canvasHeight: string;

  public fileName: string;

  constructor(
    public scene: SceneService,
    private max_min: MaxMinService,
    private node: ThreeNodesService,
    private member: ThreeMembersService,
    private fixNode: ThreeFixNodeService,
    private fixMember: ThreeFixMemberService,
    private joint: ThreeJointService,
    private panel: ThreePanelService,
    private points: ThreeNoticePointsService,
    private load: ThreeLoadService,
    private disg: ThreeDisplacementService,
    private reac: ThreeReactService,
    private fsec: ThreeSectionForceService,
    private helper: DataHelperModule,
    private printService: PrintService,
    private InputData: InputDataService,
    private secForce: ThreeSectionForceService,
    private customThree: PrintCustomThreeService,
    private resultFsec: ResultCombineFsecService
  ) {}

  //////////////////////////////////////////////////////
  // 初期化
  public OnInit(): void {
    this.node.OnInit();
    this.member.OnInit();
  }

  //////////////////////////////////////////////////////
  // ファイルを開く処理する
  public fileload(): void {
    // ファイルを読み込んだ
    this.node.changeData();
    this.member.changeData();
    this.fixNode.ClearData();
    this.fixMember.ClearData();
    this.joint.ClearData();
    this.panel.changeData();
    this.load.ResetData();
    this.disg.ClearData();
    this.reac.ClearData();
    this.fsec.ClearData();

    this.scene.render();
  }

  //////////////////////////////////////////////////////
  // データの変更通知を処理する
  public changeData(mode: string = "", index: number = 0): void {
    switch (mode) {
      case "nodes":
        this.load.changeNode(this.node.changeData());
        this.member.changeData();
        break;

      case "members":
        this.load.changeMember(this.member.changeData());
        break;

      case "elements":
        // nothing
        break;
      case "notice-points":
        // nothing
        this.points.changeData();
        break;

      case "joints":
        this.joint.changeData(index);
        break;

      case "panel":
        this.panel.changeData(index);
        break;

      case "fix_nodes":
        this.fixNode.changeData(index);
        break;

      case "fix_member":
        this.fixMember.changeData(index);
        break;

      case "load_names":
        this.load.changeCase(index);
        break;

      case "load_values":
        this.load.changeData(index);
        break;

      default:
        // 何御しない
        return;
    }

    // 再描画
    this.scene.render();

    this.currentIndex = index;
  }

  //////////////////////////////////////////////////////
  // データの選択を処理する
  public selectChange(mode: string, index: number, index_sub: any): void {
    //console.log("selectChange", mode, index, index_sub);

    switch (mode) {
      case "nodes":
        this.node.selectChange(index);
        break;

      case "members":
        this.member.selectChange(index);
        break;

      case "elements":
        this.member.selectChange(index, mode);
        break;

      case "notice-points":
        this.points.selectChange(index);
        break;

      case "joints":
        this.joint.selectChange(index, index_sub);
        break;

      case "fix_nodes":
        this.fixNode.selectChange(index, index_sub);
        break;

      case "fix_member":
        this.fixMember.selectChange(index, index_sub);
        break;

      case "panel":
        this.panel.selectChange(index);
        break;

      case "load_names":
        this.load.selectChange(-1, index_sub); // 選択を解除する
        break;

      case "load_values":
        this.load.selectChange(index, index_sub);
        break;
    }
  }

  //////////////////////////////////////////////////////
  // データをクリアする
  public ClearData(): void {
    // 節点データの削除
    this.node.ClearData();
    this.member.ClearData();
    this.fixNode.ClearData();
    this.fixMember.ClearData();
    this.joint.ClearData();
    this.panel.ClearData();
    this.load.ClearData();
    this.disg.ClearData();
    this.reac.ClearData();
    this.fsec.ClearData();

    // 再描画
    this.max_min.maxMinClear(); //max,min表示消す
    this.scene.setNewHelper(100);
    this.scene.render();
  }

  //////////////////////////////////////////////////////
  // 編集ページの変更通知を処理する
  public ChangePage(currentPage: number, option = {}): void {
    if (this.currentIndex === currentPage) {
      return;
    }

    switch (this.mode) {
      case "elements":
        break;

      case "joints":
        this.joint.changeData(currentPage);
        break;

      case "panel":
        this.panel.changeData(currentPage);
        break;

      case "fix_nodes":
        this.fixNode.changeData(currentPage);
        break;

      case "fix_member":
        this.fixMember.changeData(currentPage);
        break;

      case "load_names":
        if ("fixMemberPage" in option)
          this.fixMember.changeData(option["fixMemberPage"]);
        if ("fixNodePage" in option)
          this.fixNode.changeData(option["fixNodePage"]);
        this.load.changeCase(currentPage);
        break;

      case "load_values":
        this.load.changeCase(currentPage);
        break;

      case "disg":
        this.disg.changeData(currentPage);
      case "comb_disg":
      case "pik_disg":
        this.max_min.getMaxMinValue(
          this.disg.value_range,
          this.mode,
          currentPage,
          'momentY'
        );
        break;

      case "reac":
        this.reac.changeData(currentPage);
      case "comb_reac":
      case "pik_reac":
        this.max_min.getMaxMinValue(
          this.reac.value_range,
          this.mode,
          currentPage,
          'momentY'
        );
        break;

      case "fsec":
      case "comb_fsec":
      case "pick_fsec":
        this.fsec.changeData(currentPage, this.mode);
        let key: string;
        if (this.secForce.currentRadio === 'axialForce' ||
            this.secForce.currentRadio === 'torsionalMorment') {
          key = 'x';
        } else if ( this.secForce.currentRadio === 'shearForceY' ||
                    this.secForce.currentRadio === 'momentY') {
          key = 'y';
        } else if ( this.secForce.currentRadio === 'shearForceZ' ||
                    this.secForce.currentRadio === 'momentZ') {
          key = 'z';
        }
        this.max_min.getMaxMinValue(
          this.secForce.value_ranges,
          this.mode,
          currentPage,
          this.secForce.currentRadio,
          key
        );
        break;
    }
    this.currentIndex = currentPage;

    this.max_min.getStatus(this.mode, this.currentIndex); // 再描画
    this.scene.render();
  }

  //////////////////////////////////////////////////////
  // 編集モードの変更通知を処理する
  public ChangeMode(ModeName: string): void {
    if (this.mode === ModeName) {
      return;
    }

    if (ModeName === "nodes") {
      this.node.visibleChange(true, true, true);
      this.member.visibleChange(true, false, false);
      this.fixNode.visibleChange(false);
      this.fixMember.visibleChange(false);
      this.joint.visibleChange(false);
      this.panel.visibleChange(true, 0.3);
      this.load.visibleChange(false, false);
      this.disg.visibleChange(false);
      this.reac.visibleChange(false);
      this.fsec.visibleChange("");
    }

    if (ModeName === "members" || ModeName === "elements") {
      this.node.visibleChange(true, false, false);
      this.member.visibleChange(true, true, true);
      this.fixNode.visibleChange(false);
      this.fixMember.visibleChange(false);
      this.joint.visibleChange(false);
      this.panel.visibleChange(true, 0.3);
      this.load.visibleChange(false, false);
      this.disg.visibleChange(false);
      this.reac.visibleChange(false);
      this.fsec.visibleChange("");
    }

    if (ModeName === "notice_points") {
      this.node.visibleChange(true, false, false);
      this.member.visibleChange(true, true, false);
      this.fixNode.visibleChange(false);
      this.fixMember.visibleChange(false);
      this.joint.visibleChange(false);
      this.panel.visibleChange(true, 0.3);
      this.load.visibleChange(false, false);
      this.disg.visibleChange(false);
      this.reac.visibleChange(false);
      this.fsec.visibleChange("");
    }

    if (ModeName === "joints") {
      this.node.visibleChange(true, false, false);
      this.member.visibleChange(true, true, false);
      this.fixNode.visibleChange(false);
      this.fixMember.visibleChange(false);
      this.joint.visibleChange(true);
      this.panel.visibleChange(true, 0.3);
      this.load.visibleChange(false, false);
      this.disg.visibleChange(false);
      this.reac.visibleChange(false);
      this.fsec.visibleChange("");
    }

    if (ModeName === "panel") {
      this.node.visibleChange(true, false, false);
      this.member.visibleChange(true, true, false);
      this.fixNode.visibleChange(false);
      this.fixMember.visibleChange(false);
      this.joint.visibleChange(false);
      this.panel.visibleChange(true);
      this.load.visibleChange(false, false);
      this.disg.visibleChange(false);
      this.reac.visibleChange(false);
      this.fsec.visibleChange("");
    }

    if (ModeName === "fix_nodes") {
      this.node.visibleChange(true, true, false);
      this.member.visibleChange(true, false, false);
      this.fixNode.visibleChange(true);
      this.fixMember.visibleChange(false);
      this.joint.visibleChange(false);
      this.panel.visibleChange(true, 0.3);
      this.load.visibleChange(false, false);
      this.disg.visibleChange(false);
      this.reac.visibleChange(false);
      this.fsec.visibleChange("");
    }

    if (ModeName === "fix_member") {
      this.node.visibleChange(true, false, false);
      this.member.visibleChange(true, true, false);
      this.fixNode.visibleChange(false);
      this.fixMember.visibleChange(true);
      this.joint.visibleChange(false);
      this.panel.visibleChange(true, 0.3);
      this.load.visibleChange(false, false);
      this.disg.visibleChange(false);
      this.reac.visibleChange(false);
      this.fsec.visibleChange("");
    }

    // 荷重図
    if (ModeName === "load_names" || ModeName === "load_values") {
      // 荷重図の変更部分を書き直す
      this.load.reDrawNodeMember();

      if (ModeName === "load_names") {
        this.node.visibleChange(true, false, false);
        this.member.visibleChange(true, false, false);
        this.fixNode.visibleChange(true);
        this.fixMember.visibleChange(true);
        this.joint.visibleChange(true);
        this.panel.visibleChange(true, 0.3);
        this.load.visibleChange(true, true);
      }

      if (ModeName === "load_values") {
        this.node.visibleChange(true, true, false);
        this.member.visibleChange(true, true, false);
        this.fixNode.visibleChange(false);
        this.fixMember.visibleChange(false);
        this.joint.visibleChange(false);
        this.panel.visibleChange(true, 0.3);
        this.load.visibleChange(true, true);
      }
      this.disg.visibleChange(false);
      this.reac.visibleChange(false);
      this.fsec.visibleChange("");
    }

    if (ModeName === "disg") {
      this.node.visibleChange(true, true, false);
      this.member.visibleChange(true, false, false);
      this.fixNode.visibleChange(false);
      this.fixMember.visibleChange(false);
      this.joint.visibleChange(false);
      this.panel.visibleChange(true, 0.3);
      this.load.visibleChange(false, false);
      this.disg.visibleChange(true);
      this.reac.visibleChange(false);
      this.fsec.visibleChange("");
    }

    if (ModeName === "comb_disg" || ModeName === "pik_disg") {
      // 何も表示しない
      this.node.visibleChange(true, true, true);
      this.member.visibleChange(true, false, false);
      this.fixNode.visibleChange(false);
      this.fixMember.visibleChange(false);
      this.joint.visibleChange(false);
      this.panel.visibleChange(false);
      this.load.visibleChange(false, false);
      this.disg.visibleChange(false);
      this.reac.visibleChange(false);
      this.fsec.visibleChange("");
    }

    if (ModeName === "reac") {
      this.node.visibleChange(true, true, false);
      this.member.visibleChange(true, false, false);
      this.fixNode.visibleChange(false);
      this.fixMember.visibleChange(false);
      this.joint.visibleChange(false);
      this.panel.visibleChange(false);
      this.load.visibleChange(false, false);
      this.disg.visibleChange(false);
      this.reac.visibleChange(true);
      this.fsec.visibleChange("");
    }

    if (ModeName === "comb_reac" || ModeName === "pik_reac") {
      // 何も表示しない
      this.node.visibleChange(true, true, true);
      this.member.visibleChange(true, false, false);
      this.fixNode.visibleChange(false);
      this.fixMember.visibleChange(false);
      this.joint.visibleChange(false);
      this.panel.visibleChange(false);
      this.load.visibleChange(false, false);
      this.disg.visibleChange(false);
      this.reac.visibleChange(false);
      this.fsec.visibleChange("");
    }

    if (
      ModeName === "fsec"
    ) {
      this.node.visibleChange(true, false, false);
      this.member.visibleChange(true, true, false);
      this.fixNode.visibleChange(false);
      this.fixMember.visibleChange(false);
      this.joint.visibleChange(false);
      this.panel.visibleChange(false);
      this.load.visibleChange(false, false);
      this.disg.visibleChange(false);
      this.reac.visibleChange(false);
      this.fsec.visibleChange(ModeName);
      let key: string;
      if ( this.secForce.currentRadio === 'axialForce' ||
            this.secForce.currentRadio === 'torsionalMorment') {
        key = 'x';
      } else if ( this.secForce.currentRadio === 'shearForceY' ||
                  this.secForce.currentRadio === 'momentY') {
        key = 'y';
      } else if ( this.secForce.currentRadio === 'shearForceZ' ||
                  this.secForce.currentRadio === 'momentZ') {
        key = 'z';
      }
      this.max_min.getMaxMinValue(
        this.secForce.value_ranges,
        ModeName,
        '1',
        this.secForce.currentRadio,
        key
      );
    }

    if (
      ModeName === "comb_fsec" ||
      ModeName === "pick_fsec"
    ) {
      this.node.visibleChange(true, false, false);
      this.member.visibleChange(true, true, false);
      this.fixNode.visibleChange(false);
      this.fixMember.visibleChange(false);
      this.joint.visibleChange(false);
      this.panel.visibleChange(false);
      this.load.visibleChange(false, false);
      this.disg.visibleChange(false);
      this.reac.visibleChange(false);
      this.fsec.visibleChange(ModeName);
      let key: string;
      if ( this.secForce.currentRadio === 'axialForce' ||
            this.secForce.currentRadio === 'torsionalMorment') {
        key = 'x';
      } else if ( this.secForce.currentRadio === 'shearForceY' ||
                  this.secForce.currentRadio === 'momentY') {
        key = 'y';
      } else if ( this.secForce.currentRadio === 'shearForceZ' ||
                  this.secForce.currentRadio === 'momentZ') {
        key = 'z';
      }
      this.max_min.getMaxMinValue(
        this.secForce.value_ranges,
        ModeName,
        '1',
        this.secForce.currentRadio,
        key
      );
    }

    this.mode = ModeName;
    this.currentIndex = -1;

    this.max_min.maxMinClear();
    this.max_min.getStatus(this.mode, this.currentIndex); // 再描画
    // 再描画
    this.scene.render();
  }

  //////////////////////////////////////////////////////
  // マウス位置とぶつかったオブジェクトを検出する
  public detectObject(mouse: THREE.Vector2, action: string): void {
    const raycaster = this.scene.getRaycaster(mouse);

    switch (this.mode) {
      case "nodes": // 節点データの更新
        this.node.detectObject(raycaster, action);
        break;

      case "fix_nodes":
        this.fixNode.detectObject(raycaster, action);
        break;

      case "joints":
        this.joint.detectObject(raycaster, action);
        break;

      case "members":
      case "elements":
        this.member.detectObject(raycaster, action);
        break;

      case "panel":
        this.panel.detectObject(raycaster, action);
        break;

      case "fix_member":
        this.member.detectObject(raycaster, action);
        break;

      case "load_values":
        this.load.detectObject(raycaster, action);
        // this.member.detectObject(raycaster, action);
        break;

      case "load_names":
        break;

      case "disg":
      case "comb_disg":
      case "pik_disg":
        break;

      case "fsec":
      case "comb_fsec":
      case "pick_fsec":
        break;

      case "reac":
      case "comb_reac":
      case "pik_reac":
        break;
    }
    // 再描画
    //this.scene.render();
  }

  //private last_ts: number;
  //private reset_ts(): void {
  //  this.last_ts = performance.now();
  //};
  //private check_ts(): number {
  //  const tmp: number = this.last_ts;
  //  this.last_ts = performance.now();
  //  return this.last_ts- tmp;
  //};

  // 印刷する図を収集する
  public async getCaptureImage(): Promise<any> {
    return new Promise((resolve, reject) => {

      //this.reset_ts();
      //console.log("starting getCaptureImage...: 0 msec");

      const result = [];
      const captureInfo = this.getCaptureCase();
      const captureCase: string[] = captureInfo.captureCase;

      //console.log('getCaptrueCase後: ' + this.check_ts() + " msec");
      const title1: string = captureInfo.title1;
      const title2: string = captureInfo.title2;
      const title3: string[] = captureInfo.title3;
      const screenArea = document.getElementById("screenArea");
      screenArea.style.width = this.canvasWidth;
      screenArea.style.height = this.canvasHeight;

      if (captureCase.length === 0) {
        html2canvas(screenArea).then((canvas) => {
          result.push({
            title: title2,
            src: canvas.toDataURL(),
          });
          resolve({ result, title1 });
        });
      } else if (
        this.mode === "fsec" ||
        this.mode === "comb_fsec" ||
        this.mode === "pick_fsec"
      ) {
        let counter = 0;
        const title4: string[] = captureInfo.title4;
        const title5: string[] = captureInfo.title5;
        for (let i = 0; i < captureCase.length; i++) {
          this.selectedNumber = 0;
          for (let j = 0; j < this.customThree.threeEditable.length; j++) {
            if (this.customThree.threeEditable[j] === true) {
              this.selectedNumber += 1;
              const key = captureCase[i];
              // const captureFescTypeName: string[] = ;
              const loadType = title4[j];
              const loadTypeJa = title5[j];
              const number: number = this.helper.toNumber(key);
              if (number === null) {
                continue;
              }

              // title3 に タイトルがあれば使う
              let name = key;
              if (title3.length > i) {
                name = title3[i];
              }
              this.ChangePage(number);

              // this.ChangePage(number,this.mode).finally(() => {
              this.secForce.changeRadioButtons(loadType);
              html2canvas(screenArea).then((canvas) => {
                result.push({
                  title: title2 + name,
                  type: loadTypeJa,
                  src: canvas.toDataURL(),
                });
                counter++;

                if (counter === captureCase.length * this.selectedNumber) {
                  resolve({ result, title1 });
                }
              });
              // });
            }
          }
        }
      } else {
        let counter = 0;
        this.currentIndex = -1; // this.ChangePageの冒頭ではじかれるため、this.currentIndexを調整
        for (let i = 0; i < captureCase.length; i++) {
          const key = captureCase[i];

          const number: number = this.helper.toNumber(key);
          if (number === null) {
            continue;
          }

          // .finally(() => {
          // title3 に タイトルがあれば使う
          let name = key;
          if (title3.length > i) {
            name = title3[i];
          }

          this.ChangePage(number);

          html2canvas(screenArea).then((canvas) => {
            result.push({
              title: title2 + name,
              src: canvas.toDataURL(),
            });
            counter++;

            if (counter === captureCase.length) {
              resolve({ result, title1 });
            }
          });
          // });
        }
      }
    });
  }
  // 印刷するケース数を返す
  private getCaptureCase(): any {
    let result: string[] = new Array();
    let title1: string = "";
    let title2: string = "";
    let title3: string[] = new Array();
    let title4: string[] = new Array();
    let title5: string[] = new Array();
    let title6: string[] = new Array();

    this.printService.setprintDocument();

    switch (this.mode) {
      case "fix_member":
        if ("fix_member" in this.printService.inputJson) {
          result = Object.keys(this.printService.inputJson.fix_member);
        }
        result = this.helper.numberSort(result);
        title1 = "部材バネ";
        title2 = "TYPE";
        break;

      case "fix_nodes":
        if ("fix_node" in this.printService.inputJson) {
          result = Object.keys(this.printService.inputJson.fix_node);
        }
        result = this.helper.numberSort(result);
        title1 = "支点";
        title2 = "TYPE";
        break;

      case "joints":
        if ("joint" in this.printService.inputJson) {
          result = Object.keys(this.printService.inputJson.joint);
        }
        result = this.helper.numberSort(result);
        title1 = "結合";
        title2 = "TYPE";
        break;

      case "load_values":
      case "load_names":
        if ("load" in this.printService.inputJson) {
          result = Object.keys(this.printService.inputJson.load);
          title3 = this.getLoadTitle();
        }
        result = this.helper.numberSort(result);
        title1 = "荷重";
        title2 = "Case";
        break;
      case "disg":
        if ("load" in this.printService.inputJson) {
          result = Object.keys(this.printService.inputJson.load);
          title3 = this.getLoadTitle();
        }
        result = this.helper.numberSort(result);
        title1 = "変位";
        title2 = "Case";
        break;
      case "fsec":
        if ("load" in this.printService.inputJson) {
          result = Object.keys(this.printService.inputJson.load);
          title3 = this.getLoadTitle();
        }
        result = this.helper.numberSort(result);
        title1 = "断面力";
        title2 = "Case";
        title4 = this.printService.fescIndex;
        title5 = this.printService.fescIndexJa;
        break;
      case "reac":
        if ("load" in this.printService.inputJson) {
          result = Object.keys(this.printService.inputJson.load);
          title3 = this.getLoadTitle();
        }
        result = this.helper.numberSort(result);
        title1 = "反力";
        title2 = "Case";
        break;

      case "comb_disg":
        result = Object.keys(this.printService.combineJson);
        result = this.helper.numberSort(result);
        title1 = "組み合わせ 変位量";
        title2 = "Comb";
        title3 = this.getCombTitle();
        break;
      case "comb_fsec":
        result = Object.keys(this.printService.combineJson);
        result = this.helper.numberSort(result);
        title1 = "組み合わせ 断面力";
        title2 = "Comb";
        title3 = this.getCombTitle();
        title4 = this.printService.fescIndex;
        title5 = this.printService.fescIndexJa;
        break;
      case "comb_reac":
        result = Object.keys(this.printService.combineJson);
        result = this.helper.numberSort(result);
        title1 = "組み合わせ 反力";
        title2 = "Comb";
        title3 = this.getCombTitle();
        break;

      case "pik_disg":
        result = Object.keys(this.printService.pickupJson);
        result = this.helper.numberSort(result);
        title1 = "ピックアップ 変位量";
        title2 = "PickUp";
        title3 = this.getPickupTitle();
        break;
      case "pick_fsec":
        result = Object.keys(this.printService.pickupJson);
        result = this.helper.numberSort(result);
        title1 = "ピックアップ 断面力";
        title2 = "PickUp";
        title3 = this.getPickupTitle();
        title4 = this.printService.fescIndex;
        title5 = this.printService.fescIndexJa;
        break;
      case "pik_reac":
        result = Object.keys(this.printService.pickupJson);
        result = this.helper.numberSort(result);
        title1 = "ピックアップ 反力";
        title2 = "PickUp";
        title3 = this.getPickupTitle();
        break;

      case "nodes": // 図が 1種類のモード
      case "members":
      case "elements":
      case "panel":
      default:
        break;
    }
    return {
      title1,
      title2,
      title3,
      title4,
      title5,
      captureCase: result,
    };
  }

  private getLoadTitle(): string[] {
    const title3: string[] = new Array();

    const load = this.printService.inputJson.load;
    for (const key of Object.keys(load)) {
      const current = load[key];
      let str: string = key;
      if (current.symbol.trim().length > 0) str += " " + current.symbol;
      if (current.name.trim().length > 0) str += " " + current.name;
      title3.push(str);
    }
    return title3;
  }

  private getCombTitle(): string[] {
    const title3: string[] = new Array();

    const comb = this.InputData.combine.getCombineJson();
    for (const key of Object.keys(this.printService.combineJson)) {
      const current = comb[key];
      let str: string = key;
      if ('name' in current) {
        str += current.name.trim().length > 0 ? " " + current.name : "";
      } else {
        str += "";
      }
      title3.push(str);
    }
    return title3;
  }

  private getPickupTitle(): string[] {
    const title3: string[] = new Array();

    const pik = this.InputData.pickup.getPickUpJson();
    for (const key of Object.keys(this.printService.pickupJson)) {
      const current = pik[key];
      let str: string = key;
      if ('name' in current) {
        str += current.name.trim().length > 0 ? " " + current.name : "";
      } else {
        str += "";
      }
      title3.push(str);
    }
    return title3;
  }
}
