let trendGradientCounter = 0;

type MaybeJQueryElement = {
  get?: (index: number) => Element | undefined;
};

function resolveElement(target: Element | MaybeJQueryElement | undefined): Element | undefined {
  if (!target) return undefined;
  if (target instanceof Element) return target;
  return target.get?.(0);
}

export function applyTrendAreaGradients(target: Element | MaybeJQueryElement | undefined) {
  const root = resolveElement(target);
  const svg = root?.querySelector("svg");
  if (!root || !svg) return;

  const chartId = root.getAttribute("data-trend-gradient-id") ?? `trend-area-${trendGradientCounter++}`;
  root.setAttribute("data-trend-gradient-id", chartId);

  const namespace = "http://www.w3.org/2000/svg";
  let defs = svg.querySelector<SVGDefsElement>("defs.trend-area-gradients");
  if (!defs) {
    defs = document.createElementNS(namespace, "defs");
    defs.classList.add("trend-area-gradients");
    svg.insertBefore(defs, svg.firstChild);
  }

  const areaPaths = Array.from(svg.querySelectorAll<SVGPathElement>(".dxc-series .dxc-elements path")).filter((path) => {
    const style = window.getComputedStyle(path);
    return style.fill !== "none" && style.stroke === "none";
  });

  areaPaths.forEach((path, index) => {
    const style = window.getComputedStyle(path);
    const color = style.fill;
    const gradientId = `${chartId}-${index}`;
    let gradient = defs?.querySelector<SVGLinearGradientElement>(`#${CSS.escape(gradientId)}`);

    if (!gradient) {
      gradient = document.createElementNS(namespace, "linearGradient");
      gradient.setAttribute("id", gradientId);
      gradient.setAttribute("x1", "0");
      gradient.setAttribute("y1", "0");
      gradient.setAttribute("x2", "0");
      gradient.setAttribute("y2", "1");
      defs?.appendChild(gradient);
    }

    gradient.innerHTML = "";
    [
      ["0%", "1"],
      ["52%", "0.34"],
      ["100%", "0"],
    ].forEach(([offset, opacity]) => {
      const stop = document.createElementNS(namespace, "stop");
      stop.setAttribute("offset", offset);
      stop.setAttribute("stop-color", color);
      stop.setAttribute("stop-opacity", opacity);
      gradient?.appendChild(stop);
    });

    path.setAttribute("fill", `url(#${gradientId})`);
    path.style.fill = `url(#${gradientId})`;
  });
}
