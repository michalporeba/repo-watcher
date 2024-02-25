export default {
  toBeNullOrString: (value) => {
    return {
      message: () => `expected ${value} to be null or a string`,
      pass: value === null || typeof value === "string",
    };
  },

  toBeUndefinedOrString: (value) => {
    return {
      message: () => `expected ${value} to be null or a string`,
      pass: value === undefined || typeof value === "string",
    };
  },

  toBeNullOrMatch: (value, pattern) => {
    return {
      message: () => `expected ${value} to be null or to match ${pattern}`,
      pass:
        value === null || (typeof value === "string" && !!value.match(pattern)),
    };
  },

  toBeNullEmptyOrMatch: (value, pattern) => {
    return {
      message: () =>
        `expected ${value} to be null, an empty string or to match ${pattern}`,
      pass:
        value === null ||
        value === "" ||
        (typeof value === "string" && !!value.match(pattern)),
    };
  },

  toCloselyMatch: (received, expected, comparator) => {
    let pass = true;
    let errorMessage = "";
    let matched = [];

    expected.forEach((expectedItem) => {
      const i = received.findIndex((actual) =>
        comparator(expectedItem, actual),
      );

      if (i >= 0) {
        try {
          expect(received[i]).toMatchObject(expectedItem);
          matched.push(expectedItem);
          received.splice(i, 1);
        } catch (error) {
          pass = false;
          errorMessage += `Matching error for expected item ${JSON.stringify(expectedItem)}: ${error.message}\n`;
        }
      } else {
        pass = false;
        errorMessage += `Expected item not found: ${JSON.stringify(expectedItem)}\n`;
      }
    });

    if (received.length > 0) {
      pass = false;
      errorMessage += `Unexpected items found: ${JSON.stringify(received)}\n`;
    }

    if (matched.length !== expected.length) {
      pass = false;
      errorMessage += `Not all expected items were matched.\n`;
    }

    return {
      message: () => errorMessage,
      pass: pass,
    };
  },
};
