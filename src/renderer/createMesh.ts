export interface Mesh {
  source: Float32Array;
  positions: Float32Array;
  uvs: Float32Array;
  indices: Uint16Array;
}

/** Builds a regular, full-image triangle grid in normalized image coordinates. */
export function createMesh(columns: number, rows: number): Mesh {
  if (columns < 2 || rows < 2 || (columns + 1) * (rows + 1) > 65_535) {
    throw new Error('Mesh dimensions are invalid for Uint16 indices');
  }

  const vertexCount = (columns + 1) * (rows + 1);
  const source = new Float32Array(vertexCount * 2);
  const uvs = new Float32Array(vertexCount * 2);
  const indices = new Uint16Array(columns * rows * 6);

  let vertex = 0;
  for (let row = 0; row <= rows; row += 1) {
    const y = row / rows;
    for (let column = 0; column <= columns; column += 1) {
      const x = column / columns;
      source[vertex] = x;
      source[vertex + 1] = y;
      uvs[vertex] = x;
      uvs[vertex + 1] = y;
      vertex += 2;
    }
  }

  let index = 0;
  for (let row = 0; row < rows; row += 1) {
    for (let column = 0; column < columns; column += 1) {
      const topLeft = row * (columns + 1) + column;
      const bottomLeft = topLeft + columns + 1;
      indices.set(
        [topLeft, bottomLeft, topLeft + 1, topLeft + 1, bottomLeft, bottomLeft + 1],
        index,
      );
      index += 6;
    }
  }

  return { source, positions: source.slice(), uvs, indices };
}
