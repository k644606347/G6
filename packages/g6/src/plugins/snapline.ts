import { AABB, Line, Tuple3Number } from '@antv/g';
import { clone } from '@antv/util';
import { CommonEvent } from '../constants';
import type { RuntimeContext } from '../runtime/types';
import { ID, IElementDragEvent, Point } from '../types';
import { divide } from '../utils/vector';
import type { BasePluginOptions } from './base-plugin';
import { BasePlugin } from './base-plugin';

export interface SnapLineOptions extends BasePluginOptions {}

const directionArr = Object.freeze(['x', 'y', 'z'] as const);
type Direction = (typeof directionArr)[number];

const alignArr = Object.freeze(['center', 'max', 'min'] as const);
type AlignType = (typeof alignArr)[number];

type LineMeta = {
  id: string;
  align: [AlignType, AlignType];
  diff: { x: number; y: number; z: number };
  aPoint: Tuple3Number;
  bPoint: Tuple3Number;
  linePoint: { x1: number; y1: number; x2: number; y2: number };
  direction: Direction;
};

/**
 * <zh/> 定位辅助线
 *
 * <en/> Snap line
 */
export class SnapLine extends BasePlugin<SnapLineOptions> {
  static defaultOptions: Partial<SnapLineOptions> = {};

  constructor(context: RuntimeContext, options: SnapLineOptions) {
    super(context, Object.assign({}, SnapLine.defaultOptions, options));

    this.bindEvents();
  }

  /**
   * <zh/> 更新网格线配置
   *
   * <en/> Update the configuration of the grid line
   * @param options - <zh/> 配置项 | <en/> options
   */
  public update(options: Partial<SnapLineOptions>) {
    super.update(options);
  }

  enableElements = ['node', 'combo'];
  private bindEvents() {
    const { graph } = this.context;

    this.enableElements.forEach((type) => {
      graph.on(`${type}:${CommonEvent.DRAG_START}`, this.onDragStart);
      graph.on(`${type}:${CommonEvent.DRAG}`, this.onDrag);
      graph.on(`${type}:${CommonEvent.DRAG_END}`, this.onDragEnd);
    });
  }

  private shadowDragBounds: AABB | undefined;
  private onDragStart = (event: IElementDragEvent) => {
    // console.log('onDragStart event', event);
    const { target } = event;
    this.shadowDragBounds = clone(this.context.element?.getElement(target.id)?.getBounds());
  };

  private onDrag = (event: IElementDragEvent) => {
    // console.log('onDrag event', event);

    const { target } = event;
    const delta = this.getDelta(event);
    this.moveShadow(delta);
    const { graph } = this.context;
    const nodes = graph.getNodeData();
    const combos = graph.getComboData();

    // console.log('event.offset', event.offset)
    // console.log('event.dx, event.dy', event.dx, event.dy)
    // console.log('delta', delta)
    // console.log('event.target', event.nativeEvent);
    // const { x: eventX, y: eventY } = event.offset
    // const [eventX, eventY] = this.shadowDragBounds;
    const offset: Tuple3Number = [5, 5, 5];

    const dragEl = this.context.element?.getElement(target.id);

    const shadowDragBounds = this.shadowDragBounds;
    if (!dragEl || !shadowDragBounds) return;

    const lineMetaMap = new Map<string, LineMeta>();

    nodes.forEach((node) => {
      if (node.id === dragEl.id) return;
      const relatedEl = this.context.element?.getElement(node.id);

      if (!relatedEl) return;

      const relatedElBounds = relatedEl.getBounds();

      // console.log('dragElBounds', dragElBounds);
      // console.log('relatedElBounds', relatedElBounds);

      const linePositionByX = this.getLinePosition({
        direction: 'x',
        aBounds: shadowDragBounds,
        bBounds: relatedElBounds,
        offset,
      });
      const linePositionByY: any[] = [];
      // const linePositionByY = this.getLinePosition({
      //   direction: 'y',
      //   aBounds: shadowDragBounds,
      //   bBounds: relatedElBounds,
      //   offset
      // });
      // console.log(node.id, linePositionByX);
      const linePositionByZ = this.getLinePosition({
        direction: 'z',
        aBounds: shadowDragBounds,
        bBounds: relatedElBounds,
        offset,
      });

      [...linePositionByX, ...linePositionByY, ...linePositionByZ].forEach((lineMeta) => {
        const { id, diff, direction, align } = lineMeta;
        const oldLineMeta = lineMetaMap.get(id);
        const diffOfDir = Math.abs(diff[direction]);
        if (!oldLineMeta) {
          lineMetaMap.set(id, lineMeta);
        } else {
          // console.log(node.id, diffOfDir, Math.abs(oldLineMeta.diff[direction]));
          const oldDiffOfDir = Math.abs(oldLineMeta.diff[direction]);
          if (oldDiffOfDir > diffOfDir) {
            lineMetaMap.set(id, lineMeta);
            // console.log(node.id, diffOfDir, Math.abs(oldLineMeta.diff[direction]));
          } else if (oldDiffOfDir === diffOfDir) {
            const diffOfOtherDirs = Object.entries(diff).reduce((result, cur) => {
              return cur[0] === direction ? result : result + Math.abs(cur[1] as number);
            }, 0);
            const oldDiffOfOtherDirs = Object.entries(oldLineMeta.diff).reduce((result, cur) => {
              return cur[0] === direction ? result : result + Math.abs(cur[1]);
            }, 0);
            // console.log('diffOfOtherDirs', diffOfOtherDirs, 'oldDiffOfOtherDirs', oldDiffOfOtherDirs);
            if (oldDiffOfOtherDirs > diffOfOtherDirs) {
              lineMetaMap.set(id, lineMeta);
            }
          }
        }
      });
    });

    for (const [id, meta] of lineMetaMap) {
      this.addLine(meta);
    }

    // console.log('lineMetaMap', lineMetaMap.keys());

    // console.log('this.lineMap.size', this.lineMap.keys());
    for (const [id, line] of this.lineMap) {
      if (!lineMetaMap.get(id)) {
        this.lineMap.delete(id);
        // todo
        // this.context.graph.getCanvas().main.removeChild(line);
      }
    }
  };

  alignModes: { [k in Direction]: [AlignType, AlignType][] } = {
    x: [
      ['center', 'center'],
      ['min', 'max'],
      ['max', 'min'],
    ],
    y: [
      ['center', 'center'],
      ['min', 'max'],
      ['max', 'min'],
    ],
    z: [],
  };

  private getLinePosition({
    direction,
    aBounds,
    bBounds,
    offset,
  }: {
    direction: Direction;
    aBounds: AABB;
    bBounds: AABB;
    offset: Tuple3Number;
  }) {
    const dataIndex = directionArr.findIndex((dir) => dir === direction);
    const offsetData = offset[dataIndex] ?? 0;

    const result: Array<LineMeta> = [];
    const alignMode = this.alignModes[direction];
    for (let i = 0; i < alignMode.length; i++) {
      const align = alignMode[i];
      const [aAlign, bAlign] = align;
      // console.log('aAlign', aAlign, 'bAlign', bAlign);
      const aPoint = aBounds[aAlign];
      const bPoint = bBounds[bAlign];
      const aData = aPoint[dataIndex];
      const bData = bPoint[dataIndex];
      const abDiff = aData - bData;
      const active = Math.abs(abDiff) <= offsetData;
      if (!active) continue;

      const diff = directionArr.reduce(
        (result, dir, index) => {
          if (dir === direction) {
            result[dir] = aBounds[aAlign][dataIndex] - bBounds[bAlign][dataIndex];
          } else {
            // todo
            // result
          }
          return result;
        },
        {} as LineMeta['diff'],
      );

      let [x1, y1] = aPoint;
      const [x2, y2] = bPoint;

      if (direction === 'x') {
        x1 = x2;
      } else if (direction === 'y') {
        y1 = y2;
      }

      result.push({
        id: `${direction}-${align[0]}`,
        direction,
        aPoint,
        bPoint,
        linePoint: { x1, y1, x2, y2 },
        align,
        diff,
      });
    }

    return result;
  }

  private calcABSpacing() {}

  private moveShadow(offset: Point) {
    if (!this.shadowDragBounds) return;
    const [dx, dy] = offset;
    const { center, min, max } = this.shadowDragBounds;
    center[0] += dx;
    center[1] += dy;
    min[0] += dx;
    min[1] += dy;
    max[0] += dx;
    max[1] += dy;
  }

  lineMap = new Map<string, Line>();
  private addLine({ id, linePoint: { x1, y1, x2, y2 } }: LineMeta) {
    let line = this.lineMap.get(id);

    if (line) {
      line.attr({ x1, y1, x2, y2 });
    } else {
      line = this.context.graph.getCanvas().appendChild(
        new Line({
          id,
          style: {
            x1,
            y1,
            x2,
            y2,
            fill: 'red',
            stroke: 'blue',
          },
        }),
      );
      this.lineMap.set(id, line);
    }
    return line;
  }

  /**
   * Get the delta of the drag
   * @param event - drag event object
   * @returns delta
   * @internal
   */
  protected getDelta(event: IElementDragEvent) {
    const zoom = this.context.graph.getZoom();
    // console.log('zoom', zoom)
    return divide([event.dx, event.dy], zoom);
  }
  /**
   * <zh/> 移动元素
   *
   * <en/> Move the element
   * @param ids - <zh/> 元素 id 集合 | <en/> element id collection
   * @param offset <zh/> 偏移量 | <en/> offset
   * @internal
   */
  protected async moveElement(ids: ID[], offset: Point) {
    const { model, element } = this.context;
    const { dropEffect } = this.options;
    ids.forEach((id) => {
      const elementType = model.getElementType(id);
      if (elementType === 'node') model.translateNodeBy(id, offset);
      else if (elementType === 'combo') model.translateComboBy(id, offset);
    });

    if (dropEffect === 'move') ids.forEach((id) => model.refreshComboData(id));
    await element!.draw({ animation: false })?.finished;
  }

  private onDragEnd = (event: IElementDragEvent) => {
    // console.log('onDragEnd event', event);
  };

  public destroy(): void {
    super.destroy();
  }
}
