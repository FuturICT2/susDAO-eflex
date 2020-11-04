import web3, json, threading, time, asyncio

class AsyncContract:
    # Collects all contract instances to start them all at once using start_all
    _instance_reg = set()
    """
    This class aims to simplify interaction with smart contracts. 
    Can be used both as a super class or as a wrapper instance of a contract.

    Usage works as follows:
    * instanciate
    * setup all event callbacks
    * start dispatching events with start(). This method won't return; if you have multiple instances, call web3_contract.start_all() start all instances at once.

    When used as a superclass, event callbacks can be created simply by adding methods with names on_EventName(eventArg).
    When used as an instance, add callbacks using the "on" decorator, see documentation below.
    To call functions (on-chain) of the smart contract, simply use self.myFunction(myArgument).
    """
    def __init__(self, abi: dict, address: str, http_provider_url: str, private_key: str = None):
        """ Setup connection to contract. Events won't dispatch yet, call start() to start polling. """
        # Connect to contract
        self.abi, self.address, self.prov_url = abi, address, http_provider_url
        self.w3 = web3.Web3(web3.Web3.HTTPProvider(self.prov_url))
        self.contract = self.w3.eth.contract(
            abi = self.abi,
            address = self.address
        )

        self.private_key = private_key

        # Setup info used to make transactions
        self._transaction_info = {
            "from": self.w3.eth.coinbase,
        }

        # Setup registries for event callbacks
        self.event_subs = {} # {event_name: {callback_1, callback_2}}       
        self.filters = {} # {event_name: filter}


        # Register class instance 
        AsyncContract._instance_reg.add(self)
    
    def __getattr__(self, attrname):
        """ To call contractFunct(myArg), simply call self.contractFunct(myArg=arg) """
        # on_ methods shouldn't be interpreted as contract function calls
        if attrname[len("on_"):] == "on_":
            raise AttributeError
        else:
            def contract_fun_wrapper(*args, **kwargs):
                fun = getattr(self.contract.functions, attrname)
                trans = fun(*args, **kwargs).buildTransaction(self._transaction_info)

                if self.private_key is not None:
                    signed_trans = self.w3.eth.account.sign_transaction(trans, private_key = self.private_key)
                    self.w3.eth.sendRawTransaction(signed_trans.rawTransaction)
                else:
                    self.w3.eth.sendTransaction(trans)
                
            return contract_fun_wrapper
    
    async def _loop_once(self):
        """ Polls and dispatches all events once. """
        # For each event type
        for event_name in self.event_subs:
            # Create new filter if not yet existing
            if event_name not in self.filters:
                self.filters[event_name] = getattr(self.contract.events, event_name)\
                                            .createFilter(fromBlock="latest")

            # For each event of that type
            for event in self.filters[event_name].get_new_entries():
                # Call each event type subscriber
                for event_sub in self.event_subs[event_name]:
                    await event_sub(**(event.args))
    
    def on(self, event_name):
        """
        Use this decorator to add callbacks to contract events.

        Example: event EventName with argument myArgument

        @contract.on("EventName")
        def on_eventName(myArgument):
            print(myArgument)
        """
        def fun_recv(fun):
            event_set = self.event_subs.setdefault(event_name, set())
            event_set.add(fun)
            
            return fun
        return fun_recv
    
    def start(self):
        """
        Start polling and dispatching events. Doesn't return.
        """
        self._register_on_methods()

        async def loop():
            while True:
                await self._loop_once()
                await asyncio.sleep(1)

        asyncio.run(loop())
    
    def _register_on_methods(self):
        """ Register all on_ methods as event callbacks """
        for on_event_name in [name for (name, field) in self.__class__.__dict__.items() if name[:len("on_")] == "on_" and callable(field)]:
            event_name = on_event_name[len("on_"):]
            # Note: getattr instead of just field above because field is connected only to class, not instance.
            self.on(event_name)(getattr(self, on_event_name))
    
    @classmethod
    def start_all(cls):
        """ Starts looping over _loop_once methods of all instances of this class. Doesn't return. """
        for instance in cls._instance_reg:
            instance._register_on_methods()
        
        async def loop():
            while True:
                for instance in cls._instance_reg:
                    await instance._loop_once()

                await asyncio.sleep(1)
        try:
            asyncio.run(loop())
        except KeyboardInterrupt:
            print("KeyboardInterrupt")
            exit(0)



start_all = AsyncContract.start_all