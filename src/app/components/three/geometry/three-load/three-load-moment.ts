import { Injectable } from '@angular/core';
import * as THREE from "three";
import { Vector2 } from 'three';
import { ThreeLoadDimension } from './three-load-dimension';

import { ThreeLoadText } from "./three-load-text";

@Injectable({
  providedIn: 'root'
})
export class ThreeLoadMoment {
  
  static id = 'MomentLoad';
  public id = ThreeLoadMoment.id;

  private arrow_mat_Red: THREE.MeshBasicMaterial;
  private arrow_mat_Green: THREE.MeshBasicMaterial;
  private arrow_mat_Blue: THREE.MeshBasicMaterial;

  private line_mat_Red: THREE.LineBasicMaterial;
  private line_mat_Green: THREE.LineBasicMaterial;
  private line_mat_Blue: THREE.LineBasicMaterial;

  private point_mat: THREE.PointsMaterial;
  
  private text: ThreeLoadText;
  private dim: ThreeLoadDimension;

  constructor(text: ThreeLoadText) {
    
    this.text = text;
    this.dim = new ThreeLoadDimension(text);

    this.arrow_mat_Red = new THREE.MeshBasicMaterial({ color: 0xff0000 });
    this.arrow_mat_Green = new THREE.MeshBasicMaterial({ color: 0x00ff00 });
    this.arrow_mat_Blue = new THREE.MeshBasicMaterial({ color: 0x0000ff });
    this.line_mat_Red = new THREE.LineBasicMaterial({ color: 0xff0000 });
    this.line_mat_Green = new THREE.LineBasicMaterial({ color: 0x00ff00 });
    this.line_mat_Blue = new THREE.LineBasicMaterial({ color: 0x0000ff });
    this.point_mat = new THREE.PointsMaterial({ size: 0.1, color: 0x080808 });

  }

  /// 節点モーメント荷重を編集する
  // target: 編集対象の荷重,
  // node: 基準点,
  // offset: 配置位置（その他の荷重とぶつからない位置）
  // value: 荷重値,
  // length: 表示上の長さ,
  // direction: 荷重の向き(rx, ry, rz)
  public create(
    node: any,
    offset: number,
    value: number,
    radius: number,
    direction: string,
    row: number,
    color: number = null
  ): THREE.Group {

    //線の色を決める
    let line_color = color;
    let arrow_mat: THREE.MeshBasicMaterial;
    let line_mat: THREE.LineBasicMaterial;

    if (color === null) {
      line_color = 0xff0000;
      arrow_mat = this.arrow_mat_Red;
      line_mat = this.line_mat_Red;
      if (direction === "ry") {
        line_color = 0x00ff00;
        arrow_mat = this.arrow_mat_Green;
        line_mat = this.line_mat_Green;
      } else if (direction === "rz") {
        line_color = 0x0000ff;
        arrow_mat = this.arrow_mat_Blue;
        line_mat = this.line_mat_Blue;
      }
    } else {
      arrow_mat = new THREE.MeshBasicMaterial({ color });
      line_mat = new THREE.LineBasicMaterial({ color });
    }

    const child = new THREE.Group();
    child.name = "child";

    // 色を変更する
    const arrow_geo = new THREE.ConeBufferGeometry(0.05, 0.25, 3, 1, false);
    const arrow = new THREE.Mesh(arrow_geo, arrow_mat);
    arrow.rotation.x = Math.PI;
    arrow.rotateZ(-Math.PI / 6)

    arrow.position.set(Math.cos(Math.PI/6), Math.sin(Math.PI/6), 0);
    arrow.name = "arrow";
    child.add(arrow);

    const curve = new THREE.EllipseCurve(
      0,
      0, // ax, aY
      1,
      1, // xRadius, yRadius
      1/6 * Math.PI,
      5/3 * Math.PI, // aStartAngle, aEndAngle
      false, // aClockwise
      0 // aRotation
    );

    const points = curve.getPoints(12);
    const line_geo = new THREE.BufferGeometry().setFromPoints(points);
    //const line_mat = new THREE.LineBasicMaterial({ color: line_color });
    const ellipse = new THREE.Line(line_geo, line_mat);
    ellipse.name = "line";
    child.add(ellipse);

    if (direction === 'rx' || direction === 'ry') {
      if (value > 0) {
        child.rotation.set(0, 0, 0);
      } else if (value < 0) {
        child.rotation.set(-Math.PI, 0, -Math.PI);
      }
    } else if (direction === 'rz') { //zのみ挙動が異なるため追加
      if (value > 0) {
        child.rotation.set(-Math.PI, 0, -Math.PI);
      } else if (value < 0) {
        child.rotation.set(0, 0, 0);
      }
    }
    child.scale.set(radius, radius, radius);

    const group0 = new THREE.Group();

    child.position.z = offset;

    // 向きを変更する
    if (direction === "rx") {
      group0.rotation.x = Math.PI / 2;
      group0.rotation.y = -Math.PI / 2;
    } else if (direction === "ry") {
      group0.rotation.x = Math.PI / 2;
    }

    //中心点を作成
    // const point_geo = new THREE.Geometry();
    // point_geo.vertices.push(new THREE.Vector3(0, 0, 0));
    // const point_mesh = new THREE.Points(point_geo, this.point_mat);
    // point_mesh.name = 'points_center';
    // point_mesh.visible = false;
    // group0.add(point_mesh);

    group0.add(child);
    group0.name = "group";

    const group = new THREE.Group();
    group.add(group0);
    group["direction"] = direction;
    group["editor"] = this;
    group['value'] = value; //値を保存

    group.name = ThreeLoadMoment.id + "-" + row.toString() + '-' + direction.toString();

    // 位置を修正する
    group.position.set(node.x, node.y, node.z);

    return group;
  }

  // 大きさを反映する
  public setSize(group: any, scale: number): void {
    for (const item of group.children) {
      item.scale.set(scale, scale, scale);
    }
  }
  // オフセットを反映する
  public setOffset(group: THREE.Group, offset: number): void {
    for (const item of group.children) {
      item.position.z = offset;
    }
  }

  // スケールを反映する
  public setScale(group: any, scale: number): void {
    group.scale.set(scale, scale, scale);
  }

  // ハイライトを反映させる
  public setColor(group: any, status: string): void {

    //置き換えるマテリアルを生成 -> colorを設定し，対象オブジェクトのcolorを変える
    const arrow_mat_Pick = new THREE.MeshBasicMaterial({ color: 0xafeeee });
    const line_mat_Pick = new THREE.LineBasicMaterial({ color: 0xafeeee });

    for (let target of group.children[0].children[0].children) {
      if (status === "clear") {
        if (target.name === 'arrow' && group.name.slice(-1) === 'x') {
          target.material = this.arrow_mat_Red; //デフォルトのカラー
        } else if (target.name === 'arrow' && group.name.slice(-1) === 'y') {
          target.material = this.arrow_mat_Green; //デフォルトのカラー
        } else if (target.name === 'arrow' && group.name.slice(-1) === 'z') {
          target.material = this.arrow_mat_Blue; //デフォルトのカラー
        } else if (target.name === 'line' && group.name.slice(-1) === 'x') {
          target.material = this.line_mat_Red; //デフォルトのカラー
        } else if (target.name === 'line' && group.name.slice(-1) === 'y') {
          target.material = this.line_mat_Green; //デフォルトのカラー
        } else if (target.name === 'line' && group.name.slice(-1) === 'z') {
          target.material = this.line_mat_Blue; //デフォルトのカラー
        }

      } else if (status === "select") {
        if (target.name === 'arrow' && group.name.slice(-1) === 'x') {
          target.material = arrow_mat_Pick; //ハイライト用のカラー
        } else if (target.name === 'arrow' && group.name.slice(-1) === 'y') {
          target.material = arrow_mat_Pick; //ハイライト用のカラー
        } else if (target.name === 'arrow' && group.name.slice(-1) === 'z') {
          target.material = arrow_mat_Pick; //ハイライト用のカラー
        } else if (target.name === 'line'  && group.name.slice(-1) === 'x') {
          target.material = line_mat_Pick; //ハイライト用のカラー
        } else if (target.name === 'line'  && group.name.slice(-1) === 'y') {
          target.material = line_mat_Pick; //ハイライト用のカラー
        } else if (target.name === 'line'  && group.name.slice(-1) === 'z') {
          target.material = line_mat_Pick; //ハイライト用のカラー
        }
      }
    }

    // 文字
    this.setText(group, status);
  }

  // 文字
  private setText(group: any, status: string): void {
    
    // 一旦削除
    const key = 'value';
    const child = group.getObjectByName("group"); 
    const old = child.getObjectByName(key);
    if(old !== undefined){
      child.remove(old);
    }
    
    if (status !== "select") {
      return;
    }

    const direction = group.direction;
    const textString: string = group[key].toFixed(2) + " kN m";

    //const text = this.text.create(textString, new Vector2(1, 0), 0.1);
    const child1 = group.getObjectByName("child")
    const group_scale = child1.scale.x; //or y or z;
    const sin30 = Math.sin(Math.PI / 6);
    const cos30 = Math.cos(Math.PI / 6)
    let text: THREE.Mesh;
    if (direction === 'rz'){
      text = this.text.create(
        textString, new Vector2(-group_scale * cos30, group_scale * sin30), 0.1);
    } else if (group.value > 0) {
      text = this.text.create(
        textString, new Vector2( group_scale * cos30, group_scale * sin30), 0.1);
    } else {
      text = this.text.create(
        textString, new Vector2(-group_scale * cos30, group_scale * sin30), 0.1);
    }
    text.rotateX(Math.PI);
    text.name = key;

    child.add(text);
  
  }

}
