import potrace from "potrace";

self.onmessage = function (event) {
  let { drawnPixels, width, height } = event.data;

  // Create a new canvas
  let canvas = new OffscreenCanvas(width, height);

  // Get the context of the canvas
  let ctx = canvas.getContext("2d");

  // Put the ImageData object onto the canvas
  ctx.putImageData(drawnPixels, 0, 0);

  // Get a Blob object from the canvas
  canvas.convertToBlob().then((blob) => {
    // Create a new FileReader
    let reader = new FileReader();

    // Read the Blob as an ArrayBuffer
    reader.readAsArrayBuffer(blob);

    // When the FileReader is done, pass the ArrayBuffer to potrace
    reader.onloadend = () => {
      potrace.trace(
        reader.result,
        {
          threshold: 200,
          color: "#000000",
          background: "none",
          optTolerance: 1,
          turbo: true,
          turnPolicy: "minority",
          alphaMax: 1,
          longCurve: false,
          curveTightness: 0,
        },
        function (err, svg) {
          if (err) throw err;
          // Send the SVG back to the main thread
          self.postMessage(svg);
        }
      );
    };
  });
};
