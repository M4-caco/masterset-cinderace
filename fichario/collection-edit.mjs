export function setupCollectionEdit(actions) {
  const byId = id => document.getElementById(id);
  const quick = byId('quickRemoveCards');
  const stop = byId('stopQuickRemove');
  const species = byId('removePokemonSpecies');
  const remove = byId('removePokemonCards');
  const count = byId('removePokemonCount');
  let active = false;
  let placed = new Map();

  function updateCount() {
    const total = placed.get(species.value) || 0;
    count.textContent = total === 1 ? '1 carta no fichário' : `${total} cartas no fichário`;
    remove.disabled = total === 0;
  }

  function setQuickRemove(next) {
    if (next && !actions.startQuickRemove()) return;
    active = next;
    document.body.classList.toggle('sc-quick-remove', active);
    quick.setAttribute('aria-pressed', String(active));
    quick.textContent = active ? 'Desativar remoção rápida' : 'Ativar remoção rápida';
    stop.hidden = !active;
  }

  quick.onclick = () => {
    setQuickRemove(!active);
    if (active) stop.focus({ preventScroll: true });
  };
  stop.onclick = () => setQuickRemove(false);
  species.onchange = updateCount;
  remove.onclick = () => {
    const pokemon = species.value;
    const total = placed.get(pokemon) || 0;
    if (total && window.confirm(`Mover ${total} carta(s) de ${pokemon} para Cartas avulsas?`)) {
      actions.removePokemon(pokemon);
    }
  };
  byId('arrangeByArt').onclick = actions.arrangeByArt;
  byId('exportCollectionBinder').onclick = () => byId('export').click();

  document.addEventListener('keydown', event => {
    if (event.key === 'Escape' && active && !event.defaultPrevented) {
      event.preventDefault();
      setQuickRemove(false);
    }
  });

  return {
    get active() { return active; },
    update(cards) {
      placed = new Map();
      for (const card of cards) {
        if (card.slot === null) continue;
        placed.set(card.pokemon, (placed.get(card.pokemon) || 0) + 1);
      }
      updateCount();
    }
  };
}
