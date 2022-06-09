import { onMount } from 'solid-js';
import { createStore } from 'solid-js/store';
import { State } from '../state/state';

let useState = (stateName) => {
  let [state, setState] = createStore({}, { name: stateName });

  let stateUpdated = (name, value) => {
    if (name !== stateName) return;
    else setState({ ...state, ...value });
  };

  let idbState = new State([], stateUpdated);

  let clear = () => {
    idbState.clear();
    setState({});
  };

  onMount(() => {
    (async () => {
      let _state = await idbState.get(stateName);

      setState(_state);
    })();
  });

  let update = (data) => {
    (async (data) => {
      await idbState.set(stateName, { ...state, ...data });
    })(data);
  };

  return [state, update, clear];
};

export default useState;
