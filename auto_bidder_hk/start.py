import asyncio, logging

# Source: https://stackoverflow.com/questions/287871/how-to-print-colored-text-in-python
class bcolors:
    HEADER = '\033[95m'
    OKBLUE = '\033[94m'
    OKCYAN = '\033[96m'
    OKGREEN = '\033[92m'
    WARNING = '\033[93m'
    FAIL = '\033[91m'
    ENDC = '\033[0m'
    BOLD = '\033[1m'
    UNDERLINE = '\033[4m'

# create logger with 'spam_application'
logger = logging.getLogger('Master')
ch = logging.StreamHandler()
ch.setLevel(logging.DEBUG)
# create formatter and add it to the handlers
formatter = logging.Formatter("%(asctime)s %(message)s", "%H:%M:%S")
ch.setFormatter(formatter)
# add the handlers to the logger
logger.addHandler(ch)
logger.setLevel(logging.DEBUG)

async def start(name, command):
    prefix = f"{bcolors.OKGREEN}[{name}]:{bcolors.ENDC}"
    logger.info(f"{prefix}{bcolors.WARNING} {command} {bcolors.ENDC}")
    proc = await asyncio.create_subprocess_shell(
        command,
        stdout=asyncio.subprocess.PIPE,
        stderr=asyncio.subprocess.PIPE,
        start_new_session=True
    )
    while not proc.stderr.at_eof():
        line = await proc.stderr.readline()
        logger.debug(f"{prefix} " + line.decode('ascii').rstrip())
        
    logger.info(f"{prefix} Terminated.")




async def main():
    commands = [
        start("Autobidder", "python3 auto_bidder.py -log WARN")
    ]


    tasks = [asyncio.create_task(cmd) for cmd in commands]
    [await task for task in tasks]


if __name__ == "__main__":
    try:
        asyncio.run(main())
    except KeyboardInterrupt:
        print("Keyboard interrupt.")


