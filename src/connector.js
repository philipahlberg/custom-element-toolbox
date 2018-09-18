export const connector = store => {
  const subscriptions = new WeakMap();

  return (SuperClass, map) =>
    class ConnectedElement extends SuperClass {
      connectedCallback() {
        const { selectors, actions } = map;

        if (selectors) {
          const update = () => Object.assign(this, selectors(store.getState()));
          const subscription = store.subscribe(update);
          subscriptions.set(this, subscription);
          update();
        }

        if (actions) {
          const dispatchers = actions(store.dispatch);
          for (const type in dispatchers) {
            this.addEventListener(type, event => {
              event.stopImmediatePropagation();
              dispatchers[type](event.detail);
            });
          }
        }

        if (super.connectedCallback) {
          super.connectedCallback();
        }
      }

      disconnectedCallback() {
        if (map.selectors) {
          const unsubscribe = subscriptions.get(this);
          unsubscribe();
        }
        if (super.disconnectedCallback) {
          super.disconnectedCallback();
        }
      }
    };
};
