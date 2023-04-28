import { Injectable } from '@angular/core';
import * as THREE from "three";
import { Vector2, Vector3 } from 'three';

import { ThreeLoadText } from "./three-load-text";
import { ThreeLoadDimension } from "./three-load-dimension";
import { ThreeLoadMoment } from './three-load-moment';

@Injectable({
  providedIn: 'root'
})
export class ThreeLoadMemberMoment {
  
  static id = 'MomentMemberLoad';
  public id = ThreeLoadMemberMoment.id;

  private moment: ThreeLoadMoment;

  private text: ThreeLoadText;
  private dim: ThreeLoadDimension;

  constructor(text: ThreeLoadText) {
    
    this.text = text;
    this.dim = new ThreeLoadDimension(text);
    this.moment = new ThreeLoadMoment(text);
  }

  /// 部材途中集中荷重を編集する
  // target: 編集対象の荷重,
  // nodei: 部材始点,
  // nodej: 部材終点,
  // localAxis: 部材座標系
  // direction: 荷重の向き(wy, wz, wgx, wgy, wgz)
  // L1: 始点からの距離
  // L2: 終点からの距離
  // P1: 始点側の荷重値
  // P2: 終点側の荷重値
  // offset: 配置位置（その他の荷重とぶつからない位置）
  // scale: スケール
  public create(
    nodei: THREE.Vector3,
    nodej: THREE.Vector3,
    localAxis: any,
    direction: string,
    pL1: number,
    pL2: number,
    P1: number,
    P2: number,
    row: number,
    count: number
  ): THREE.Group {

    const offset: number = 0;
    const height: number = 1;

    // const child = new THREE.Group(); // 荷重の原本
    const group = new THREE.Group(); // 荷重を動かす

    // 長さを決める
    const p = this.getPoints(
      nodei, nodej, direction, pL1, pL2, P1, P2, height);

    const L1 = p.L1;
    const L2 = p.L2;

    let P: number;
    let L: number;
    if (count === 1) {
      P = P1;
      L = L1;
    } else {
      P = P2;
      L = L2;
    }

    if(P===0)
      return null;
    // 矢印
    const arrow: THREE.Group = this.getArrow(direction, P, L);
    arrow.position.y = offset;

    // 全体
    // child.name = "child";
    // child.position.y = offset;
    // child.add(arrow)
    // group.add(child)

    group.add(arrow);
    group.name = "group";

    // 全体の位置を修正する
    group["points"] = p.points;
    group["L1"] = p.L1;
    group["L"] = p.LL;
    group["L2"] = p.L2;
    group["P1"] = P1;
    group["P2"] = P2;
    group["nodei"] = nodei;
    group["nodej"] = nodej;
    group["direction"] = direction;
    group["localAxis"] = localAxis;
    group["editor"] = this;
    group['value'] = P; // 値を保存

    group.position.set(nodei.x, nodei.y, nodei.z);

    // 全体の向きを修正する

    if (!direction.includes('g')) {
      const XY = new Vector2(localAxis.x.x, localAxis.x.y).normalize();
      let A = Math.asin(XY.y);

      if (XY.x < 0) {
        A = Math.PI - A;
      }
      group.rotateZ(A);

      const lenXY = Math.sqrt(Math.pow(localAxis.x.x, 2) + Math.pow(localAxis.x.y, 2));
      const XZ = new Vector2(lenXY, localAxis.x.z).normalize();
      group.rotateY(-Math.asin(XZ.y));


    } else if (direction === "gx") {
      group.rotation.z = Math.asin(-Math.PI / 2);

    } else if (direction === "gz") {
      group.rotation.x = Math.asin(-Math.PI / 2);

    }
    group.name = ThreeLoadMemberMoment.id + "-" + row.toString() + '-' + direction.toString();

    return group;
  }

  // 座標
  private getPoints(
    nodei: THREE.Vector3,
    nodej: THREE.Vector3,
    direction: string,
    pL1: number,
    pL2: number,
    P1: number,
    P2: number,
    height: number,
  ): any {

    const len = nodei.distanceTo(nodej);

    let LL: number = len;

    // 絶対座標系荷重の距離変換を行う
    if (direction === "gx") {
      LL = new THREE.Vector2(nodei.z, nodei.y).distanceTo(new THREE.Vector2(nodej.z, nodej.y));
    } else if (direction === "gy") {
      LL = new THREE.Vector2(nodei.x, nodei.z).distanceTo(new THREE.Vector2(nodej.x, nodej.z));
    } else if (direction === "gz") {
      LL = new THREE.Vector2(nodei.x, nodei.y).distanceTo(new THREE.Vector2(nodej.x, nodej.y));
    }
    const L1 = pL1 * len / LL;
    const L2 = pL2 * len / LL;

    // 荷重の各座標
    const x1 = L1;
    const x2 = L2;

    // y座標 値の大きい方が１となる
    const Pmax = (Math.abs(P1) > Math.abs(P2)) ? P1 : P2;

    const bigP = Math.abs(Pmax);
    let y1 = (P1 / bigP) * height;
    let y2 = (P2 / bigP) * height;

    if (direction === "x") {
      y1 = (height / 10);
      y2 = (height / 10);
    }

    return {
      points: [
        new THREE.Vector3(x1, y1, 0),
        new THREE.Vector3(x2, y2, 0),
      ],
      L1,
      L2,
      LL,
      Pmax
    };
  }

  // 両端の矢印
  private getArrow(
    direction: string,
    value: number,
    points: number): THREE.Group {

    const result: THREE.Group = new THREE.Group();

    const key: string = 'r' + direction;

    const Px = value;

    const pos1 = new THREE.Vector3(points, 0, 0);

    const arrow_1 = this.moment.create(pos1, 0, Px, 1, key, 0)

    //モーメントの作成時に向きまで制御しているので，制御不要
    //if (direction === 'y') {
    //arrow_1.rotation.z += Math.PI;
    //} else if (direction === 'z') {
    //arrow_1.rotation.x += Math.PI / 2;
    //}

    result.add(arrow_1);
    result.name = "arrow";

    return result;

  }

  // 大きさを反映する
  public setSize(group: any, scale: number): void {

    for (const item of group.children) {
      if (item.name === 'arrow') {
        for (const item_child2 of item.children) {
          if (item_child2.name.includes('MomentLoad')) {
            for (const item_child3 of item_child2.children) {
              if (item_child3.name === 'group') {
                for (const item_child4 of item_child3.children) {
                  if (item_child4.name === 'child') {
                    item_child4.scale.set(scale, scale, scale);
                  }
                }
              }
            }
          }
        }
      }
    }

  }

  // オフセットを反映する
  public setOffset(group: THREE.Group, offset: number): void {
    for (const item of group.children) {
      item.position.y = offset;
    }
  }

  public setGlobalOffset(group: THREE.Group, offset: number, key: string): void {
    const k = key.replace('wg', '');
    for (const item of group.children) {
      item.position[k] = offset;
    }
  }

  // 大きさを反映する
  public setScale(group: any, scale: number): void {

    for (const item of group.children) {
      if (item.name === 'arrow') {
        for (const item_child2 of item.children) {
          if (item_child2.name.includes('MomentLoad')) {
            for (const item_child3 of item_child2.children) {
              if (item_child3.name === 'group') {
                // for (const item_child4 of item_child3.children) {
                  // if (item_child4.name === 'child') {
                    item_child3.scale.set(scale, scale, scale);
                  // }
                // }
              }
            }
          }
        }
      }
    }

  }

  // ハイライトを反映させる
  public setColor(group: any, status: string) {

    const group0 = group.getObjectByName('group');
    const child = group0.getObjectByName('child');

    for (let target of child.children) {
      if ( target.name.includes('MomentLoad')){
        this.moment.setColor(target, status);
      } else if(target.name === 'Dimension'){
        if (status === 'select') {
          target.visible = true;
        } else {
          target.visible = false;
        }
      }
    }

    // 寸法線
    this.setDim(group, status);
  }

  // 寸法線
  private setDim(group: any, status: string): void{
    
    let point: THREE.Vector3[] = group.points;
    const L1: number = group.L1;
    const L: number = group.L;
    const L2: number = group.L2;
    const P1: number = group.P1;
    const P2: number = group.P2;
    if (L2 === 0 && P2 === 0) {
      point[1].x = L
    }

    const points: THREE.Vector3[] = [ new Vector3(point[0].x, 0, 0), 
                                      new Vector3(point[0].x, 0, 0),
                                      new Vector3(point[1].x, 0, 0),
                                      new Vector3(point[1].x, 0, 0) ];

    // 一旦削除
    const text = group.getObjectByName('Dimension');

    if(text !== undefined){
      group.remove(text);
    }

    if (status !== "select") {
      return;
    }

    const dim = new THREE.Group();

    let dim1: THREE.Group;
    let dim2: THREE.Group;
    let dim3: THREE.Group;

    const size: number = 0.1; // 文字サイズ

    const y4 = (size * 10);

    if(L1 > 0){
      const x0 = points[1].x - L1;
      const p = [
        new THREE.Vector2(x0, 0),
        new THREE.Vector2(x0, y4),
        new THREE.Vector2(points[1].x, y4),
        new THREE.Vector2(points[1].x, points[1].y),
      ];
      dim1 = this.dim.create(p, point[0].x.toFixed(3))
      dim1.visible = true;
      dim1.name = "Dimension1";
      dim.add(dim1);
    }

    //if (L2 > 0) {
      const p = [
        new THREE.Vector2(points[1].x, points[1].y),
        new THREE.Vector2(points[1].x, y4),
        new THREE.Vector2(points[2].x, y4),
        new THREE.Vector2(points[2].x, points[2].y),
      ];
      dim2 = this.dim.create(p, (point[1].x - point[0].x).toFixed(3))
      dim2.visible = true;
      dim2.name = "Dimension2";
      dim.add(dim2);
    //}

    if(L2 > 0){
      const x4 = L;
      const p = [
        new THREE.Vector2(points[2].x, points[2].y),
        new THREE.Vector2(points[2].x, y4),
        new THREE.Vector2(x4, y4),
        new THREE.Vector2(x4, 0),
      ];
      dim3 = this.dim.create(p, (L - point[1].x).toFixed(3))
      dim3.visible = true;
      dim3.name = "Dimension3";
      dim.add(dim3);
    }

    // 登録
    dim.name = "Dimension";
    //center.visible = true;
    dim.rotateX(Math.PI)

    group.add(dim);
    

  }
}
