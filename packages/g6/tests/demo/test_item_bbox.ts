import { Graph, extend, Extensions } from '../../src/index';
import type { TestCaseContext } from './interface';

const ExtGraph = extend(Graph, {
  behaviors: {
    'scroll-canvas': Extensions.ScrollCanvas,
    'drag-node': Extensions.DragNode,
    'zoom-canvas': Extensions.ZoomCanvas as any,
    // 'drag-canvas': Extensions.DragCanvas,
    // 'drag-combo': Extensions.DragCombo,
  },
});

export default (context: TestCaseContext) => {
  const startTime = new Date('2023-08-01').getTime();
  const diff = 3600 * 24 * 1000;
  const graphData = {
    nodes: new Array(49).fill(0).map((_, index) => ({
      id: `node-${index}`,
      data: {
        timestamp: startTime + (index % 10) * diff,
        value: index % 20,
        label: new Date(startTime + (index % 10) * diff).toLocaleString(),
      },
    })),
    edges: new Array(49).fill(0).map((_, i) => ({
      id: `edge-${i}`,
      source: `node-${i % 30}`,
      target: `node-${(i % 20) + 29}`,
      data: {
        edgeType: 'e1',
      },
    })),
  };
  (document.querySelector('#app') as HTMLElement).style.height = '2000px'
  const graph = (window as any).__graph = new ExtGraph({
    ...context,
    width: 800,
    height: 500,
    layout: {
      type: 'grid',
    },
    node: {
      labelShape: {
        text: {
          fields: ['id'],
          formatter: (model) => model.id,
        },
      },
    },
    modes: {
      default: [
        {
          type: 'scroll-canvas',
          enableOptimize: true,
          zoomRatio: 0.2,
          // scalableRange: 0.5,
          // direction: 'y',
          // optimizeZoom: 0.5,
        },
        'zoom-canvas',
        'drag-node',
        // 'drag-combo',
        // 'drag-canvas'
      ],
    },
    data: graphData,
  });
  graph.on('viewportchange', e => {
    const testItem = (graph as any).getItemById('node-7')
    console.log(
      'node-7 getBBox', JSON.stringify(testItem.getBBox()),
      'node-7 getPosition', JSON.stringify(testItem.getPosition())
    )
})

  return graph;
};
