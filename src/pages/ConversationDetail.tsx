useEffect(() => {
  const textarea = textareaRef.current;
  if (!textarea) return;

  // 1. On remet la hauteur à 'auto' pour recalculer.
  // 2. On lit le "scrollHeight" de la textarea.
  // 3. On fixe la nouvelle hauteur à min(scrollHeight, 120).
  const adjustHeight = () => {
    textarea.style.height = 'auto';
    const newHeight = Math.min(textarea.scrollHeight, 120);
    textarea.style.height = `${newHeight}px`;
  };

  adjustHeight();
}, [newMessage]);
