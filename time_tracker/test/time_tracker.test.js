test('должен сохранить в localStorage', () => {
    const KEY = 'TaskArr',
      VALUE = '3';
    dispatch(action.update(KEY, VALUE));
    expect(localStorage.setItem).toHaveBeenLastCalledWith(KEY, VALUE);
    expect(localStorage.__STORE__[KEY]).toBe(ЗНАЧЕНИЕ);
    expect(Object.keys(localStorage.__STORE__).length).toBe(1);
  });
  
  test('должен был очистить sessionStorage', () => {
    dispatch(action.reset());
    expect(sessionStorage.clear).toHaveBeenCalledTimes(1);
    expect(sessionStorage.__STORE__).toEqual({}); // проверка ожидаемых значений
    хранилища (sessionStorage.length).toBe(0); // или check length
  });
  
  test('не должен был сохраняться в localStorage', () => {
    const KEY = 'TaskArr',
      VALUE = '3';
    dispatch(action.notIdempotent(KEY, VALUE));
    expect(localStorage.setItem).not.toHaveBeenLastCalledWith(KEY, VALUE);
    expect(Object.ключи(localStorage.__STORE__).length).toBe(0);
  });

  test('обновление localStorage', () => {
    const KEY = 'TaskArr',
      VALUE = '3';
    dispatch(action.update(KEY, VALUE));
    expect(localStorage.setItem).toHaveBeenLastCalledWith(KEY, VALUE);
    expect(localStorage.__STORE__[KEY]).toBe(VALUE);
    expect(Object.keys(localStorage.__STORE__).length).toBe(1);
  });
  