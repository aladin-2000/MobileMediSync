// hooks/useConfirmModal.js
// Fournit confirm()/notify() basés sur des promesses pour piloter <ConfirmModal/>,
// à la place de Alert.alert (popup natif, moche et non stylable).
import React, { useCallback, useState } from 'react';
import ConfirmModal from '../components/ConfirmModal';

export default function useConfirmModal() {
  const [state, setState] = useState(null);

  // confirm({ title, message, variant, confirmText, cancelText }) -> Promise<boolean>
  const confirm = useCallback((options) => {
    return new Promise((resolve) => {
      setState({ ...options, alertOnly: false, resolve });
    });
  }, []);

  // notify({ title, message, variant, confirmText }) -> Promise<void> (bouton unique)
  const notify = useCallback((options) => {
    return new Promise((resolve) => {
      setState({ ...options, alertOnly: true, resolve });
    });
  }, []);

  const close = (result) => {
    state?.resolve?.(result);
    setState(null);
  };

  const modal = (
    <ConfirmModal
      visible={!!state}
      title={state?.title}
      message={state?.message}
      variant={state?.variant}
      confirmText={state?.confirmText}
      cancelText={state?.cancelText}
      alertOnly={state?.alertOnly}
      onConfirm={() => close(true)}
      onCancel={() => close(false)}
    />
  );

  return { confirm, notify, modal };
}
