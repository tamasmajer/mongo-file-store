# mongo-file-store
Simple command line interface for storing files on MongoDB using GridFS. 

## Status

Only have been tested with text files.

Needs support for synchronization. 

Should provide a driver simulating a key-value store.

## Usage

Install as a command:
```
npm install -g
```

Go to the directory where the uploadable folders are.

```
mongo-file-store
```

Press enter for help. This will print:

```
>
connect <optional_mongo_db_nick_name> <optional_mongo_db_URI_with_password>
    - Connects to a mongo db.
    - Saves the name URI pair into the mongo-file-store.txt file.
    - If already saved it is enough to provide the name.
    - If you don't want to save the server provide only the URI.
    - To list all servers call it without parameters.
```

Create and store a connection:
 
```
connect hawaii mongodb://<name>:<password>/<domain>:<port>/<collection>
``` 

If connected, press enter for help:

```
hawaii>

 Commands:

  ls - Lists files and folders.
  tree - Lists recursively files and folders.
  find - Lists recursively all file paths.
  cd - Changes directory.
  pwd - Prints working directory.
  md <remote_path> - Makes directories and step into it.
  cat - Prints remote file to console.
  rm <remote_file_or_dir> - Removes a relative file or folder.
  clear - Removes all contents from current remote directory.
  up <from_local_dir> - Uploads local directory into the empty server folder.
  down <into_local_dir> - Downloads server folder into a new local directory.
  connect <optional_mongo_db_nick_name> <optional_mongo_db_URI_with_password>
    - Connects to a mongo db.
    - Saves the name URI pair into the local mongo-file-store.txt file.
    - If already saved it is enough to provide the name.
    - If you don't want to save the server provide only the URI.
    - To list all servers call it without parameters.
  disconnect <optional_mongo_db_nick_name>
    - Disconnects from the current mongo db.
    - If you provide a name, it will be removed from the mongo-file-store.txt file.
  exit - Exits from this tool.
```


