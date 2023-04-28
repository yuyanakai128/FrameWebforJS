import { Injectable } from '@angular/core';
import * as THREE from "three";
import { Vector2, Vector3 } from 'three';

import { ThreeLoadText } from "./three-load-text";
import { ThreeLoadDimension } from "./three-load-dimension";
import { ThreeLoadPoint } from './three-load-point';
import { RouterLinkWithHref } from '@angular/router';

@Injectable({
  providedIn: 'root'
})
export class ThreeLoadMemberPoint {

  static id = 'PointMemberLoad';
  public id = ThreeLoadMemberPoint.id;

  private point: ThreeLoadPoint;
  
  private text: ThreeLoadText;
  private dim: ThreeLoadDimension;

  constructor(text: ThreeLoadText) {
    
    this.text = text;
    this.dim = new ThreeLoadDimension(text);
    this.point = new ThreeLoadPoint(text);
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

    const child = new THREE.Group();

    // 長さを決める
    const p = this.getPoints(
      nodei, nodej, direction, pL1, pL2, P1, P2, height);

    const points: THREE.Vector3[] = p.points;
    const length = nodei.distanceTo(nodej);
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
    /* 同じようなことを getPoints でもやってるのでコメントアウト
    if (pL1 < 0 || length < pL1) {
      P1 = 0;
    }
    if (pL2 < 0 || length < pL2) {
      P2 = 0;
    }
    */

    // 荷重値0 ならば null を返す。
    if(P===0)
      return null;

    // 矢印
    const arrow: THREE.Group = this.getArrow(direction, length, P, L);
    arrow.position.y = offset;
    arrow.name = "arrow"

     // 全体
    //child.name = "child";
    //child.position.y = offset;
    //child.add(arrow);
    //group.add(child);

    // const group0 = new THREE.Group();
    // group0.add(arrow);
    // group0.name = "group";

    // 全体の位置を修正する
    const group = new THREE.Group();
    group.add(arrow);
    group["points"] = p.points;
    group["L1"] = p.L1;
    group["L"] = p.len;
    group["L2"] = p.L2;
    group["P1"] = P1;
    group["P2"] = P2;
    group["nodei"] = nodei;
    group["nodej"] = nodej;
    group["direction"] = direction;
    group["localAxis"] = localAxis;
    group["editor"] = this;
    group['value'] = P; // 値を保存

    // 全体の向きを修正する
    this.setRotate(direction, group, localAxis);

    // 全体の位置を修正する
    this.setPosition(direction, group, nodei, nodej, P1, P2);

    group.name = ThreeLoadMemberPoint.id + "-" + row.toString() + '-' + direction.toString();

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

    let len = nodei.distanceTo(nodej);
/* この判定は、input-load.service でやるべきなので コメントアウト
    if (pL1 < 0 || len < pL1) {
      pL1 = 0;
      P1 = 0;
    }
    if (pL2 < 0 || len < pL2) {
      pL2 = 0;
      P2 = 0;
    }
*/
    //let LL: number = len;

    // 絶対座標系荷重の距離変換を行う
    if (direction === "gx") {
      len = new THREE.Vector2(nodei.z, nodei.y).distanceTo(new THREE.Vector2(nodej.z, nodej.y));
    } else if (direction === "gy") {
      len = new THREE.Vector2(nodei.x, nodei.z).distanceTo(new THREE.Vector2(nodej.x, nodej.z));
    } else if (direction === "gz") {
      len = new THREE.Vector2(nodei.x, nodei.y).distanceTo(new THREE.Vector2(nodej.x, nodej.y));
    }
    const L1 = pL1;
    const L2 = pL2;

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
      len,
      Pmax
    };
  }


  // 両端の矢印
  private getArrow(
    direction: string,
    length: number,
    value: number,
    points: number): THREE.Group {

    const result: THREE.Group = new THREE.Group();

    const key: string = 't' + direction;

    const Px = value;

    const pos1 = new THREE.Vector3(points, 0, 0);
    if (direction === 'x') {
      pos1.y = 0.1;
    }

    //6番目の代入値は不適切
    const arrow_1 = this.point.create(pos1, 0, Px, 1, key, 0);

    if (direction === 'y') {
      arrow_1.rotation.z += Math.PI;
    } else if (direction === 'z') {
      arrow_1.rotation.x += Math.PI / 2;
    } else if (direction === "gx") {
      const arrowhelper = arrow_1.getObjectByName('arrow');
      // 仕様の位置に届かせるための微調整
      arrowhelper.position.y += 1;
    } else if (direction === "gy" || direction === "gz") {
      const arrowhelper = arrow_1.getObjectByName('arrow');
      // 仕様の位置に届かせるための微調整
      // if (value[i] > 0) {
      if (value > 0) {
        arrowhelper.position.x += 1;
      } else {
        arrowhelper.position.x -= 1;
      }
    }
    arrow_1.rotateX(Math.PI)

    result.add(arrow_1);

    return result;

  }

  // 大きさを反映する
  public setSize(group: any, scale: number): void {
    for (const item of group.children) {
      if (item.name === 'arrow') {
        for (const item_child1 of item.children) {
          if (item_child1.name.includes('PointLoad')) {
            for (const item_child2 of item_child1.children) {
              item_child2.scale.set(scale, scale, scale);
            }
          }
        }
      }
    }
  }

  // オフセットを反映する
  public setOffset(group: THREE.Group, offset: number): void {
    for (const item of group.children) {
      if (item.name === 'arrow') {
        for (const item_child1 of item.children) {
          item_child1.position.y = offset;
        }
      }
    }
  }

  public setGlobalOffset(group: THREE.Group, offset: number, key: string): void {
    const group0 = group.getObjectByName("group");
    const child = group0.getObjectByName("child");
    for (const item of child.children) {
      item.position.y = offset + 1;
    }
  }

  // 大きさを反映する
  public setScale(group: any, scale: number): void {
    for (const item of group.children) {
      //if (item.name === 'arrow') {
        //for (const item_child1 of item.children) {
          item.scale.set(1, scale, scale);
          // コーンの先が細く、または太くなる。
          //item.children[0].scale.x = scale;
        //}
      //}
    }
  }

  // ハイライトを反映させる
  public setColor(group: any, status: string) {

    const group0 = group.getObjectByName('group');
    const child = group0.getObjectByName('child');

    for (let target of child.children) {
      if ( target.name.includes('PointLoad')){
        this.point.setColor(target, status);
      } else if(target.name === 'Dimension'){
        if (status === 'clear') {
          target.visible = false;
        } else if (status === 'select') {
          target.visible = true;
        }
      }
    }


    // 寸法線
    this.setDim(group, status);

  }

  // 全体の向きを修正する
  private setRotate( direction: string, group: any, 
                     localAxis: { x:Vector3, y:Vector3, z:Vector3 }) {

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

      if (localAxis.x.x === 0 && localAxis.x.y === 0) {
        // 鉛直の部材
        if (direction === "z") {
          group.rotateX(-Math.PI);
        } else if (direction === "y") {
          group.rotateX(Math.PI / 2);
        }
      } else {
        if (direction === "z") {
          group.rotateX(-Math.PI / 2);
        } else if (direction === "y") {
          group.rotateX(Math.PI);
        }
      }

    } else if (direction === "gx") {
      group.rotateZ(Math.PI / 2);
      group.rotation.x = (Math.atan( localAxis.x.z / localAxis.x.y ))
    } else if (direction === "gy") {
      group.rotateX(Math.PI);
      group.rotation.y = (Math.atan( localAxis.x.z / localAxis.x.x ))
    } else if (direction === "gz") {
      group.rotation.z = (Math.atan( localAxis.x.y / localAxis.x.x ))
      group.rotateX(-Math.PI / 2);
    }

  }

  // 
  private setPosition(direction: string, group: any, 
                      nodei: Vector3, nodej: Vector3, 
                      P1: number, P2: number) {

    if (!direction.includes('g')) {
      group.position.set(nodei.x, nodei.y, nodei.z);
    } else if (direction === 'gx') {
      // nodeとPの関係によって、セットする位置(x座標)が異なる。
      if (P1 >= 0 && P2 >= 0) {
        if (nodei.x >= nodej.x) {
          group.position.set(nodej.x, nodei.y, nodei.z);
        } else {
          group.position.set(nodei.x, nodei.y, nodei.z);
        }
      } else {
        if (nodei.x >= nodej.x) {
          group.position.set(nodei.x, nodei.y, nodei.z);
        } else {
          group.position.set(nodej.x, nodei.y, nodei.z);
        }
      }
    } else if (direction === 'gy') {
      // nodeとPの関係によって、セットする位置(y座標)が異なる。
      if (P1 >= 0 && P2 >= 0) {
        if (nodei.y >= nodej.y) {
          group.position.set(nodei.x, nodej.y, nodei.z);
        } else {
          group.position.set(nodei.x, nodei.y, nodei.z);
        }
      } else {
        if (nodei.y >= nodej.y) {
          group.position.set(nodei.x, nodei.y, nodei.z);
        } else {
          group.position.set(nodei.x, nodej.y, nodei.z);
        }
      }
    } else if (direction === 'gz') {
      // nodeとPの関係によって、セットする位置(z座標)が異なる。
      if (P1 >= 0 && P2 >= 0) {
        if (nodei.z >= nodej.z) {
          group.position.set(nodei.x, nodei.y, nodej.z);
        } else {
          group.position.set(nodei.x, nodei.y, nodei.z);
        }
      } else {
        if (nodei.z >= nodej.z) {
          group.position.set(nodei.x, nodei.y, nodei.z);
        } else {
          group.position.set(nodei.x, nodei.y, nodej.z);
        }
      }
    }
  }

  // 寸法線
  private setDim(group: any, status: string): void{
    
    let point: THREE.Vector3[] = group.points;
    //const offset: number = group.offset;
    const L1: number = group.L1;
    const L: number = group.L;
    const L2: number = group.L2;
    const P1: number = group.P1;
    const P2: number = group.P2;
    if (L2 === 0) {
      point[1].x = L
    }

    const points: THREE.Vector3[] = [ new Vector3(point[0].x, 0, 0), 
                                      new Vector3(point[0].x, point[0].y, point[0].z),
                                      new Vector3(point[1].x, point[1].y, point[1].z),
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

    const y1a = Math.abs(points[1].y);
    const y3a = Math.abs(points[2].y);
    const y4a = Math.max(y1a, y3a) + (size * 10);
    const a = (y1a > y3a) ? Math.sign(points[1].y) : Math.sign(points[2].y);
    const y4 = a * y4a;

    if(L1 > 0){
      const x0 = points[1].x - L1;
      const p = [
        new THREE.Vector2(x0, 0),
        new THREE.Vector2(x0, y4),
        new THREE.Vector2(points[1].x, y4),
        new THREE.Vector2(points[1].x, points[1].y),
      ];
      const points0x = point[0].x.toString()
      dim1 = this.dim.create(p, Number(points0x).toFixed(3))
      dim1.visible = true;
      dim1.name = "Dimension1";
      dim.add(dim1);
    }

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

    group.add(dim);

  }
}
