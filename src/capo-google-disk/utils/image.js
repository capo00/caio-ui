const Image = {
  getUri(id, { width = 1000 } = {}) {
    return `https://drive.google.com/thumbnail?id=${id}&sz=w${width}`;
  },
};

export { Image };
export default Image;
