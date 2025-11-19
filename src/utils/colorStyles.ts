const getColorCount = () => {
  return Number(
    getComputedStyle(document.documentElement)
      .getPropertyValue("--color-count")
      .trim()
  );
}

export const getColorIndex = (index: number) => {
  const colorCount = getColorCount();
  return (index % colorCount);
}
