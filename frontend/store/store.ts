import { createStore } from 'redux';

const initialState = {};

// A placeholder reducer that does nothing
const reducer = (state = initialState) => {
  return state;
};

// Create the Redux store
const store = createStore(reducer);

export default store;
