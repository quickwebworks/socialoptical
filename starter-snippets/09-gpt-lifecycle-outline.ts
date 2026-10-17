// Outline inside the shared provider/AdSlot, not a drop-in complete component.
// Run only after the consent controller permits the relevant request.
window.googletag = window.googletag || { cmd: [] };
window.googletag.cmd.push(() => {
  // Validate path/sizes from trusted published placement configuration.
  const slot = window.googletag.defineSlot(adUnitPath, sizes, uniqueElementId);
  if (!slot) return;
  slot.addService(window.googletag.pubads());
  // Set contextual targeting only from allowed non-sensitive values.
  slot.setTargeting('section', categorySlug);
  // Shared provider enables services once, after initial configuration.
  window.googletag.display(uniqueElementId);
  // Retain `slot`; on unmount queue destroySlots([slot]).
});
