interface DevState {
  html: undefined | string
}

const devState: DevState = {
  html: undefined,
}

const updateState = (newValue: string) => {
  devState.html = newValue
}

export { updateState, devState }
