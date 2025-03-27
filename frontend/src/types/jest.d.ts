declare global {
  const jest: any;
  namespace jest {
    function spyOn(object: any, methodName: string): any;
    // Add other Jest functions you're using
  }
}

export {};