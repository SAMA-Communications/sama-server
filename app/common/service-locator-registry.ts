/**
 * Augment this interface to type `ServiceLocatorContainer.use()` by service name:
 *
 * declare module "@sama/common/service-locator-registry.js" {
 *   interface ServiceLocatorRegistry {
 *     Config: typeof config
 *   }
 * }
 */
export interface ServiceLocatorRegistry {}
