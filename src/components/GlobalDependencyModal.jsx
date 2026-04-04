import React, { useState, useEffect } from 'react';
import { softDeleteEventEmitter } from '@/hooks/useSoftDelete';
import { DependenciesWarningModal } from '@/components/DependenciesWarningModal';

// This component acts as a portal for the softDelete hook modal
export const GlobalDependencyModal = () => {
  const [modalState, setModalState] = useState({ open: false, dependencies: null });

  useEffect(() => {
    const unsubscribe = softDeleteEventEmitter.subscribe((data) => {
      setModalState(data);
    });
    return unsubscribe;
  }, []);

  const handleClose = () => {
    if (modalState.onClose) modalState.onClose();
    setModalState({ open: false, dependencies: null });
  };

  const handleDeleteAnyway = async () => {
    if (modalState.onDeleteAnyway) await modalState.onDeleteAnyway();
    setModalState({ open: false, dependencies: null });
  };

  const handleCascadeDelete = async () => {
    if (modalState.onCascadeDelete) await modalState.onCascadeDelete();
    setModalState({ open: false, dependencies: null });
  };

  if (!modalState.open) return null;

  return (
    <DependenciesWarningModal 
      open={modalState.open}
      dependencies={modalState.dependencies}
      onClose={handleClose}
      onDeleteAnyway={handleDeleteAnyway}
      onCascadeDelete={handleCascadeDelete}
    />
  );
};