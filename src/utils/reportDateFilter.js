const startOfDay = (date) => {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
};

const endOfDay = (date) => {
  const d = new Date(date);
  d.setHours(23, 59, 59, 999);
  return d;
};

export const getReportDateRange = (
  period = "THIS_MONTH",
  fromDate,
  toDate
) => {
  const now = new Date();

  let from;
  let to;

  switch (period) {
    case "TODAY":
      from = startOfDay(now);
      to = endOfDay(now);
      break;

    case "YESTERDAY": {
      const yesterday = new Date(now);
      yesterday.setDate(now.getDate() - 1);

      from = startOfDay(yesterday);
      to = endOfDay(yesterday);
      break;
    }

    case "THIS_WEEK": {
      const day = now.getDay();
      const diff = day === 0 ? -6 : 1 - day;

      from = new Date(now);
      from.setDate(now.getDate() + diff);
      from = startOfDay(from);

      to = endOfDay(now);
      break;
    }

    case "LAST_WEEK": {
      const day = now.getDay();
      const diff = day === 0 ? -6 : 1 - day;

      const thisWeekStart = new Date(now);
      thisWeekStart.setDate(now.getDate() + diff);
      thisWeekStart.setHours(0, 0, 0, 0);

      from = new Date(thisWeekStart);
      from.setDate(from.getDate() - 7);

      to = new Date(thisWeekStart);
      to.setMilliseconds(-1);

      break;
    }

    case "THIS_MONTH":
      from = new Date(
        now.getFullYear(),
        now.getMonth(),
        1
      );

      to = endOfDay(now);
      break;

    case "LAST_MONTH":
      from = new Date(
        now.getFullYear(),
        now.getMonth() - 1,
        1
      );

      to = new Date(
        now.getFullYear(),
        now.getMonth(),
        0
      );

      to = endOfDay(to);
      break;

    case "THIS_QUARTER": {
      const quarterStartMonth =
        Math.floor(now.getMonth() / 3) * 3;

      from = new Date(
        now.getFullYear(),
        quarterStartMonth,
        1
      );

      to = endOfDay(now);
      break;
    }

    case "LAST_QUARTER": {
      const currentQuarter =
        Math.floor(now.getMonth() / 3);

      const quarterStartMonth =
        (currentQuarter - 1) * 3;

      if (currentQuarter === 0) {
        from = new Date(
          now.getFullYear() - 1,
          9,
          1
        );

        to = new Date(
          now.getFullYear() - 1,
          11,
          31
        );
      } else {
        from = new Date(
          now.getFullYear(),
          quarterStartMonth,
          1
        );

        to = new Date(
          now.getFullYear(),
          quarterStartMonth + 3,
          0
        );
      }

      to = endOfDay(to);
      break;
    }

    case "THIS_YEAR":
      from = new Date(
        now.getFullYear(),
        0,
        1
      );

      to = endOfDay(now);
      break;

    case "LAST_YEAR":
      from = new Date(
        now.getFullYear() - 1,
        0,
        1
      );

      to = new Date(
        now.getFullYear() - 1,
        11,
        31
      );

      to = endOfDay(to);
      break;

    case "CUSTOM":
      if (!fromDate || !toDate) {
        throw new Error(
          "Please select both From Date and To Date."
        );
      }

      from = startOfDay(fromDate);
      to = endOfDay(toDate);

      if (from > to) {
        throw new Error(
          "From Date cannot be greater than To Date."
        );
      }

      break;

    default:
      throw new Error("Invalid report period.");
  }

  return {
    fromDate: from,
    toDate: to,
  };
};