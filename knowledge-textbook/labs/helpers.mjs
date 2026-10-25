// Reviewed widget helpers. Selectors and state remain inside one approved lab.
export function scoped(root) {
  const controller = new AbortController();
  const owned = node => node?.closest('.hm-reviewed-lab') === root;
  const selectorFor = selector => /^#[a-zA-Z0-9_-]+$/.test(selector)
    ? '[data-source-anchor="' + selector.slice(1) + '"]' : selector;
  const qa = selector => [...root.querySelectorAll(selectorFor(selector))].filter(owned);
  const q = selector => qa(selector)[0] ?? null;
  const listen = (node, type, handler, options = {}) => {
    if (!node?.addEventListener) throw new Error('Missing reviewed lab control: ' + type);
    node.addEventListener(type, handler, {...options, signal: controller.signal});
  };
  return {q, qa, listen, dispose: () => controller.abort()};
}
export function readControls(root) {
  const result = {};
  for (const node of root.querySelectorAll('input,select,textarea')) {
    if (node.closest('.hm-reviewed-lab') !== root || !node.dataset.sourceAnchor) continue;
    result[node.dataset.sourceAnchor] = {value: node.value, checked: Boolean(node.checked)};
  }
  result.__details = [...root.querySelectorAll('details')].filter(n=>n.closest('.hm-reviewed-lab')===root).map(n=>n.open);
  return result;
}
export function restoreControls(root, state) {
  if (!state || typeof state !== 'object') return;
  for (const node of root.querySelectorAll('input,select,textarea')) {
    if (node.closest('.hm-reviewed-lab') !== root) continue;
    const saved = state[node.dataset.sourceAnchor];
    if (!saved || typeof saved.value !== 'string' || saved.value.length > 20000) continue;
    if (node.tagName !== 'SELECT' || [...node.options].some(option=>option.value===saved.value)) node.value = saved.value;
    if (node.type === 'checkbox' || node.type === 'radio') node.checked = saved.checked === true;
  }
  const details = [...root.querySelectorAll('details')].filter(n=>n.closest('.hm-reviewed-lab')===root);
  if (Array.isArray(state.__details)) details.forEach((node,i)=>{if(typeof state.__details[i]==='boolean')node.open=state.__details[i];});
}
export function addReset(root, reset, listen) {
  const button = root.ownerDocument.createElement('button');
  button.type = 'button'; button.dataset.labReset = 'true'; button.textContent = 'เริ่ม Lab ใหม่';
  const toolbar = root.ownerDocument.createElement('div'); toolbar.className = 'hm-lab-toolbar';
  const label = root.ownerDocument.createElement('span'); label.textContent = 'ห้องทดลอง · ลองปรับค่า';
  toolbar.append(label,button); root.prepend(toolbar); listen(button,'click',reset); return button;
}
