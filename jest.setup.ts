import '@testing-library/jest-dom';

// ResizeObserver is not available in jsdom
global.ResizeObserver = class ResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
};

// scrollIntoView is not available in jsdom — required by cmdk
Element.prototype.scrollIntoView = jest.fn();

// jsdom doesn't implement URL.createObjectURL / revokeObjectURL
if (typeof URL.createObjectURL === 'undefined') {
  // @ts-ignore - augment global URL in tests
  URL.createObjectURL = function (blob: any) {
    return 'blob://mock-' + Math.random().toString(36).slice(2);
  };
}

if (typeof URL.revokeObjectURL === 'undefined') {
  // @ts-ignore
  URL.revokeObjectURL = function (_url: string) {
    return undefined;
  };
}
