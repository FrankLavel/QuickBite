# Decisiones técnicas (ADR)

Registro breve de las decisiones de arquitectura y su **motivo**. Formato: contexto →
decisión → por qué → contrapartidas.

---

### ADR-01 · Firebase (BaaS) como backend
**Decisión.** Usar Firebase (Auth + Firestore + Storage + Cloud Functions) en vez de un backend propio.
**Por qué.** Proyecto pequeño con un solo desarrollador; tiempo real, autenticación y escalado "gratis"; sin servidores que mantener.
**Contrapartidas.** Acoplamiento al proveedor; el modelo NoSQL obliga a denormalizar y a mover la lógica de confianza a Cloud Functions.

### ADR-02 · Base de código única con Expo (web + nativo)
**Decisión.** El dashboard es una app Expo/React Native ejecutada en **web** vía React Native Web.
**Por qué.** Reutilizar componentes y conocimiento con la app móvil; un solo stack para todo el ecosistema.
**Contrapartidas.** Algunas APIs del navegador no existen en RN (p. ej. `Alert.alert`) y hubo que sustituirlas (ver ADR-08).

### ADR-03 · Estado global con React Context (no Redux)
**Decisión.** Cuatro contextos (`Auth`, `Order`, `Product`, `Promotion`) consumidos por hooks.
**Por qué.** El estado es acotado y por dominio; Redux añadiría ceremonia innecesaria.
**Contrapartidas.** Sin dev-tools ni middleware; si el estado creciera mucho habría que reconsiderarlo.

### ADR-04 · Capa de servicios que aísla Firestore
**Decisión.** Las pantallas nunca llaman al SDK directo; pasan por `services/`.
**Por qué.** Separación de responsabilidades, testeabilidad y un único lugar donde cambiar el acceso a datos.
**Contrapartidas.** Una capa de indirección extra.

### ADR-05 · Pagos en Cloud Functions, nunca en el cliente
**Decisión.** El cobro (`createCardCharge`) recalcula montos y cobra en Openpay desde el servidor; la tarjeta se **tokeniza** contra Openpay.
**Por qué.** Seguridad (PCI: la tarjeta no toca servidores propios) y anti-manipulación (no se confía en el total del cliente).
**Contrapartidas.** Latencia extra y dependencia de Cloud Functions para pagar.

### ADR-06 · Openpay single-merchant + liquidación manual
**Decisión.** La plataforma cobra todo a su comercio Openpay y **liquida manualmente** a cada restaurante (módulo *Liquidaciones*). El modelo reserva `openpayMerchantId` por restaurante.
**Por qué.** Simplicidad para arrancar sin dar de alta un comercio por restaurante; el campo reservado permite migrar a split/cuentas propias sin rehacer el flujo.
**Contrapartidas.** La conciliación es un proceso operativo del restaurante (no automático).

### ADR-07 · Comisión de plataforma del 7 %
**Decisión.** Retener **7 %** (`PLATFORM_COMMISSION_RATE`), no ~15 %.
**Por qué.** Propuesta de valor: apoyar a fondas locales de Michoacán con una comisión mucho menor que la de los competidores.
**Contrapartidas.** Menor margen; el valor está en el volumen y la misión.

### ADR-08 · Avisos propios en vez de `Alert.alert`
**Decisión.** Sistema de toasts/diálogos pub/sub (`utils/notify.ts` + `ToastHost`, `utils/confirm.ts`).
**Por qué.** `Alert.alert` no funciona en React Native Web.
**Contrapartidas.** Mantener un componente propio de avisos.

### ADR-09 · Tema por variables CSS
**Decisión.** Cada color en `theme.ts` es una `var(--qb-*)`; `applyTheme(mode)` reescribe las variables en `document.documentElement`.
**Por qué.** Cambio de modo claro/oscuro instantáneo sin re-renderizar ni cambiar los componentes.
**Contrapartidas.** Depende del DOM (web); en nativo requeriría otra estrategia.

### ADR-10 · Geocodificación con Nominatim (OpenStreetMap)
**Decisión.** `geocode` usa Nominatim con fallback.
**Por qué.** Gratuito, sin tarjeta ni clave; suficiente para ubicar el restaurante.
**Contrapartidas.** Límites de uso y precisión variable frente a servicios de pago.

### ADR-11 · Cuentas de restaurante aprovisionadas por consola
**Decisión.** El dashboard es **solo-login**; el admin crea `users/{uid}` (rol `restaurant`) + `restaurants/{id}` en la Firebase Console.
**Por qué.** Evita que cualquiera se auto-asigne el rol `restaurant`.
**Contrapartidas.** Alta manual (aceptable para el volumen actual). Ver [authentication.md](authentication.md#4-aprovisionamiento-de-cuentas-de-restaurante).

### ADR-12 · Tests centrados en lógica de negocio pura
**Decisión.** Con `jest-expo`, testear funciones puras (formato, validación, estados, reglas de cupón); no montar renderizado de RN ni mockear Firestore extensivamente.
**Por qué.** Máximo valor por esfuerzo y tests estables; el CRUD de Firestore requeriría mocks frágiles.
**Contrapartidas.** El I/O de los servicios queda sin cobertura automatizada.

---

## Decisiones abiertas (v2.0)

### ADR-13 · Canal de ubicación del repartidor *(pendiente)*
**Contexto.** El GPS del repartidor se actualiza con alta frecuencia durante la entrega.
**Opciones.** (a) Documento Firestore por entrega; (b) **Realtime Database** (más barato y natural para posiciones frecuentes); (c) un tercero.
**Criterios.** Costo por escritura, latencia, y que la ubicación se guarde **solo durante la entrega activa** y se purgue al terminar (privacidad).
**Estado.** Por decidir al implementar la [arquitectura v2.0](architecture.md#4-arquitectura-objetivo-v20).
