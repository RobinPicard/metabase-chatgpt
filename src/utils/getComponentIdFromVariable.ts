interface VarObj {
  [key: string]: any;
}

function getComponentIdFromVariable(varObj: VarObj): string {
  return Object.keys(varObj)[0];
}

export default getComponentIdFromVariable;
