import { Injectable } from '@angular/core';
import * as THREE from "three";
import { Vector2 } from 'three';

import { ThreeLoadDimension } from './three-load-dimension';
import { ThreeLoadText } from "./three-load-text";

@Injectable({
  providedIn: 'root'
})
export class ThreeLoadTemperature {
  
  static id = 'TemperatureLoad';
  public id = ThreeLoadTemperature.id;

  private colors: number[];
  private arrow_mat: THREE.MeshBasicMaterial;

  private matLine: THREE.LineBasicMaterial;

  private text: ThreeLoadText;
  private dim: ThreeLoadDimension;

  constructor(text: ThreeLoadText) {
    
    this.text = text;
    this.dim = new ThreeLoadDimension(text);

    this.arrow_mat = new THREE.MeshBasicMaterial({ color: 0xff0000 });

    this.matLine = new THREE.LineBasicMaterial({
      color: 0xff0000,
      linewidth: 0.001, // in pixels
      vertexColors: true,
    });
  }
  public create(
    nodei: THREE.Vector3,
    nodej: THREE.Vector3,
    localAxis: any,
    P1: number,
    row: number
  ): THREE.Group {

    const offset: number = -0.1;

    const child = new THREE.Group();

    const L = nodei.distanceTo(nodej);

    // 線を描く
    const points = [];
    points.push(new THREE.Vector3(0, 0, 0));
    points.push(new THREE.Vector3(L, 0, 0));

    const geometry = new THREE.BufferGeometry().setFromPoints( points );

    const line2 = new THREE.Line(geometry, this.matLine);
    line2.computeLineDistances();
    line2.name = 'line2';

    child.add(line2);

    // 矢印を描く
    // const arrow_geo = new THREE.ConeBufferGeometry(0.05, 0.25, 3, 1, false);
    // const arrow = new THREE.Mesh(arrow_geo, this.arrow_mat);
    // arrow.rotation.z = -Math.PI / 2;
    // arrow.name = "arrow";

    // child.add(arrow);
    child.name = "child";

    // 全体
    child.name = "child";
    child.position.y = offset;

    const group0 = new THREE.Group();
    group0.add(child);
    group0.name = "group";

    // 全体の位置を修正する
    const group = new THREE.Group();
    group.add(group0);
    group["P1"] = P1;
    group["nodei"] = nodei;
    group["nodej"] = nodej;
    group["localAxis"] = localAxis;
    group["editor"] = this;
    group['value'] = Math.abs(P1); // 大きい方の値を保存　
    group["L"] = L;

    group.position.set(nodei.x, nodei.y, nodei.z);

    // 全体の向きを修正する
    const XY = new Vector2(localAxis.x.x, localAxis.x.y).normalize();
    group.rotateZ(Math.asin(XY.y));

    const lenXY = Math.sqrt(Math.pow(localAxis.x.x, 2) + Math.pow(localAxis.x.y, 2));
    const XZ = new Vector2(lenXY, localAxis.x.z).normalize();
    group.rotateY(-Math.asin(XZ.y));

    group.name = ThreeLoadTemperature.id + "-" + row.toString() + '-x';
    return group;
  }


  // 大きさを反映する
  public setSize(group: any, scale: number): void {
    for (const item of group.children) {
      item.scale.set(1, scale, scale);
    }
  }

  // 大きさを反映する
  public setScale(group: any, scale: number): void {
    group.scale.set(1, scale, scale);
  }

  // ハイライトを反映させる
  public setColor(group: any, status: string): void {

    //置き換えるマテリアルを生成 -> colorを設定し，対象オブジェクトのcolorを変える
    const matLine_Pick = new THREE.LineBasicMaterial({
      color: 0x00ffff,
      linewidth: 0.001, 
      vertexColors: true,
    })
    const arrow_mat_Pick = new THREE.MeshBasicMaterial({ color: 0x00ffff });

    for (let target of group.children[0].children[0].children) {
      if (status === 'clear') {
        if (target.name === 'line2') {
          target.material = this.matLine; //デフォルトのカラー
        } else if (target.name === 'arrow') {
          target.material = this.arrow_mat //デフォルトのカラー
        }
      } else if (status === "select") {
        if (target.name === 'line2') {
          target.material = matLine_Pick; //ハイライト用のカラー
        } else if (target.name === 'arrow') {
          target.material = arrow_mat_Pick; //ハイライト用のカラー
        }
      }

      // 文字
      this.setText(group, status);

      // 寸法線
      this.setDim(group, status);
    }
  }


  // 文字
  private setText(group: any, status: string): void {
    
    // 一旦削除
    const key = 'P1';
    const group0 = group.getObjectByName('group');
    const child = group0.getObjectByName('child');
    const old = child.getObjectByName(key);
    if(old !== undefined){
      child.remove(old);
    }

    if (status !== "select") {
      return;
    }

    const localAxis = group.localAxis;
    const pos = new Vector2(group.L / 2, child.position.y)
    const vartical = ['bottom', 'top'];

    const textString: string = group[key].toFixed(2) + " °C";
    const text = this.text.create(textString, pos, 0.1);
    const height = Math.abs(text.geometry.boundingBox.max.y - text.geometry.boundingBox.min.y);
    const width = Math.abs(text.geometry.boundingBox.max.x - text.geometry.boundingBox.min.x);
    text.position.x += 0.5 * height;
    text.position.y -= 0.5 * height;
    text.rotateX(Math.PI);
    text.name = key;
    group.add(text);

  }

  // 寸法線
  private setDim(group: any, status: string): void{
    
    const group0 = group.getObjectByName('group');
    const child = group0.getObjectByName('child');

    // 一旦削除
    const text = group.getObjectByName('Dimension');
    if(text !== undefined){
      group.remove(text);
    }

    if (status !== "select") {
      return;
    }

    const points: THREE.Vector3[] = [
      new THREE.Vector3(0, 0, 0),
      new THREE.Vector3(0, child.position.y, 0),
      new THREE.Vector3(group.L, child.position.y, 0),
      new THREE.Vector3(group.L, 0, 0),
    ];

    const L: number = group.L;

    const dim = new THREE.Group();

    let dim1: THREE.Group;

    const size: number = 0.1; // 文字サイズ

    const y4 = (size * 10);

    const p = [
      new THREE.Vector2(points[0].x, 0),
      new THREE.Vector2(points[0].x, y4),
      new THREE.Vector2(points[3].x, y4),
      new THREE.Vector2(points[3].x, 0),
    ];
    dim1 = this.dim.create(p, L.toFixed(3))
    dim1.visible = true;
    dim1.name = "Dimension1";
    dim.add(dim1);

    dim.rotateX(Math.PI)

    // 登録
    dim.name = "Dimension";

    group.add(dim);
    

  }
  
}
