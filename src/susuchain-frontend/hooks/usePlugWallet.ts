import { createPlugConfig, validatePrincipalId } from '../config/plug-config';

export const initializePlug = async () => {
  if (!window.ic?.plug) {
    throw new Error('Plug wallet is not installed');
  }

  const plugConfig = createPlugConfig();
  const result = await window.ic.plug.requestConnect(plugConfig);

  if (!result) {
    throw new Error('Failed to connect to Plug wallet');
  }

  return result;
};

export const isPlugConnected = async () => {
  if (!window.ic?.plug) {
    return false;
  }
  return await window.ic.plug.isConnected();
};

export const disconnectPlug = async () => {
  if (window.ic?.plug) {
    await window.ic.plug.disconnect();
  }
};

export const getPlugPrincipal = async () => {
  if (!window.ic?.plug) {
    throw new Error('Plug wallet is not installed');
  }
  const principal = await window.ic.plug.agent.getPrincipal();
  return validatePrincipalId(principal.toString());
};
