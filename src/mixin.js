export const Mixin = Mix => {
  const mixes = new WeakSet();

  return SuperClass => {
    let prototype = SuperClass;
    while (prototype != null) {
      if (mixes.has(prototype)) {
        return SuperClass;
      }

      prototype = Object.getPrototypeOf(prototype);
    }

    const application = Mix(SuperClass);
    mixes.add(application);
    return application;
  };
};
